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
        DEPLOYED_LOG         = '/opt/app-config/frontend-deployed.log'
        NEXT_PUBLIC_API_URL  = 'https://api-catalyst-security.zyloscode.com'
        API_BACKEND_URL      = 'http://backend-staging:5000'
    }

    stages {

        stage('Install & Lint') {
            steps {
                sh '''
                    node -v
                    npm ci
                    npm run lint
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    if npm run | grep -qE '^\\s*test'; then
                        npm test
                    else
                        echo "No test script defined in package.json — skipping"
                    fi
                '''
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