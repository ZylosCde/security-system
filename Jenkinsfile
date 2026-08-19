// Jenkinsfile for security-system (Next.js frontend)
// Place this at the ROOT of the security-system repo (same level as package.json).
//
// PRE-REQUISITES:
//   1. GET /api/health returns 200 — src/app/api/health/route.ts. Confirmed.
//   2. docker/files/prod.app.dockerfile has a HEALTHCHECK on /api/health. Confirmed.
//   3. The Jenkins container must bind-mount these host paths, because all
//      shell redirects are resolved INSIDE the Jenkins container, not on the
//      VPS host:
//        /opt/app-config:/opt/app-config:ro   (read-only)
//        /opt/app-backups:/opt/app-backups    (writable)
//      DEPLOYED_LOG therefore lives under /opt/app-backups, NOT app-config.
//   4. The Jenkins container has no Node.js installed. "Install & Lint" and
//      "Test" run inside a throwaway node:20-alpine container (matches
//      prod.app.dockerfile) via the Docker Pipeline plugin's
//      docker.image().inside{} — not on the Jenkins host directly.
//   5. URL wiring — src/lib/api-client.ts getBaseUrl():
//        - In the BROWSER it always uses the relative path "/api/v1".
//          Next.js rewrites() then proxies that to API_BACKEND_URL.
//        - On the SERVER (SSR) it uses NEXT_PUBLIC_API_URL directly.
//      Both values MUST end in /api/v1:
//        API_BACKEND_URL     -> next.config.ts appends "/:path*" to it
//        NEXT_PUBLIC_API_URL -> api-client appends "/officer" etc. to it
//   6. The backend must be reachable as backend-staging:5000 on the "edge"
//      Docker network. The frontend joins "edge" only — it never talks to
//      MySQL directly, so it does not need the "data" network.

pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '30'))
        timestamps()
    }

    parameters {
        booleanParam(name: 'DEPLOY_TO_STAGING', defaultValue: false,
            description: 'Deploy this build to staging after tests pass')
    }

    environment {
        IMAGE_NAME           = 'security-system'
        IMAGE_TAG            = "${env.GIT_COMMIT ? env.GIT_COMMIT.take(8) : env.BUILD_NUMBER}"
        CONTAINER            = 'frontend-staging'
        EDGE_NETWORK         = 'edge'
        DEPLOYED_LOG         = '/opt/app-backups/frontend-deployed.log'
        NEXT_PUBLIC_API_URL  = 'https://api-catalyst-security.zyloscode.com/api/v1'
        API_BACKEND_URL      = 'http://backend-staging:5000/api/v1'
        NODE_IMAGE           = 'node:20-alpine'
    }

    stages {

        stage('Install & Lint') {
            steps {
                script {
                    docker.image(env.NODE_IMAGE).inside('-u root') {
                        sh '''
                            node -v
                            npm ci
                            npm run lint
                        '''
                    }
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    docker.image(env.NODE_IMAGE).inside('-u root') {
                        sh '''
                            if npm run 2>/dev/null | grep -qE '^[[:space:]]+test$'; then
                                npm test
                            else
                                echo "No test script defined in package.json — skipping"
                            fi
                        '''
                    }
                }
            }
        }

        stage('Build image') {
            steps {
                sh """
                    docker build -f docker/files/prod.app.dockerfile \
                        --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
                        --build-arg API_BACKEND_URL=${API_BACKEND_URL} \
                        -t ${IMAGE_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage('Approve deploy') {
            when { expression { params.DEPLOY_TO_STAGING } }
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    input message: "Deploy ${env.IMAGE_NAME}:${env.IMAGE_TAG} (branch ${env.BRANCH_NAME}) to staging?"
                }
            }
        }

        stage('Deploy') {
            when { expression { params.DEPLOY_TO_STAGING } }
            steps {
                sh '''
                    docker network create ${EDGE_NETWORK} 2>/dev/null || true
                    docker stop ${CONTAINER} 2>/dev/null || true
                    docker rm ${CONTAINER} 2>/dev/null || true
                    docker run -d \
                        --name ${CONTAINER} \
                        --network ${EDGE_NETWORK} \
                        --restart unless-stopped \
                        --memory=768m --cpus=1.0 \
                        -e NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
                        -e API_BACKEND_URL=${API_BACKEND_URL} \
                        ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Health check') {
            when { expression { params.DEPLOY_TO_STAGING } }
            steps {
                sh '''
                    for i in $(seq 1 15); do
                        STATUS=$(docker inspect --format="{{.State.Health.Status}}" ${CONTAINER} 2>/dev/null || echo "starting")
                        if [ "$STATUS" = "healthy" ]; then
                            echo "Container is healthy"
                            exit 0
                        fi
                        echo "Attempt $i: status=$STATUS, waiting..."
                        sleep 4
                    done
                    echo "Container did not report healthy in time — check 'docker logs ${CONTAINER}'"
                    exit 1
                '''
            }
        }

        stage('Verify backend link') {
            when { expression { params.DEPLOY_TO_STAGING } }
            steps {
                sh '''
                    # Prove the frontend container can actually reach the backend
                    # over the edge network before we call this deploy good.
                    docker exec ${CONTAINER} wget -qO- http://backend-staging:5000/healthz \
                        || { echo "Frontend cannot reach backend-staging:5000"; exit 1; }
                    echo ""
                    echo "Frontend -> backend link OK"
                '''
            }
        }
    }

    post {
        success {
            script {
                if (params.DEPLOY_TO_STAGING) {
                    sh "echo ${IMAGE_TAG} >> ${DEPLOYED_LOG}"
                }
            }
        }
        failure {
            script {
                if (params.DEPLOY_TO_STAGING) {
                    sh '''
                        LAST_GOOD=$(tail -n 1 ${DEPLOYED_LOG} 2>/dev/null || echo "")
                        if [ -n "$LAST_GOOD" ]; then
                            echo "Rolling back to ${IMAGE_NAME}:${LAST_GOOD}"
                            docker stop ${CONTAINER} 2>/dev/null || true
                            docker rm ${CONTAINER} 2>/dev/null || true
                            docker run -d \
                                --name ${CONTAINER} \
                                --network ${EDGE_NETWORK} \
                                --restart unless-stopped \
                                -e NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
                                -e API_BACKEND_URL=${API_BACKEND_URL} \
                                ${IMAGE_NAME}:${LAST_GOOD}
                        else
                            echo "No prior successful deploy recorded — nothing to roll back to"
                        fi
                    '''
                }
            }
        }
        always {
            sh 'docker image prune -f --filter "until=48h" || true'
        }
        cleanup {
            cleanWs()
        }
    }
}
