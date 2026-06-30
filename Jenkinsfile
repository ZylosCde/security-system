pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        APP_NAME       = 'security-system'
        APP_PORT       = '3002'
        GIT_REPO       = 'https://github.com/ZylosCde/security-system.git'
        GIT_BRANCH     = 'prod'
        COMPOSE_FILE   = 'docker/docker-compose.yml'
    }

    stages {
        stage('Checkout source') {
            steps {
                deleteDir()
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
            }
        }

        stage('Preflight') {
            steps {
                script {
                    def composeCmd = sh(
                        script: '''
                            set -eu
                            if docker compose version >/dev/null 2>&1; then
                              echo "docker compose"
                            elif command -v docker-compose >/dev/null 2>&1; then
                              echo "docker-compose"
                            else
                              echo "ERROR: install Docker Compose (docker compose plugin or docker-compose package)" >&2
                              exit 1
                            fi
                        ''',
                        returnStdout: true
                    ).trim()
                    env.COMPOSE_CMD = composeCmd
                    echo "Using: ${composeCmd}"
                }
            }
        }

        stage('Build image locally') {
            steps {
                sh '''
                    set -eu
                    docker build -f docker/files/dev.app.dockerfile -t security-system:latest .
                '''
            }
        }

        stage('Deploy locally') {
            steps {
                dir('docker') {
                    sh '''
                        set -eu
                        ${COMPOSE_CMD} -f docker-compose.yml down --remove-orphans || true
                        ${COMPOSE_CMD} -f docker-compose.yml up -d --build --remove-orphans
                    '''
                }
            }
        }

        stage('Health check') {
            steps {
                sh '''
                    set -eu
                    for i in $(seq 1 30); do
                        if ${COMPOSE_CMD} -f docker-compose.yml exec -T web sh -c \
                          "node -e \"require('http').get('http://127.0.0.1:' + (process.env.PORT || 3002), r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))\"" \
                          >/dev/null 2>&1; then
                            echo "App is healthy on ${APP_PORT}"
                            exit 0
                        fi
                        sleep 2
                    done
                    echo 'Health check failed'
                    ${COMPOSE_CMD} -f docker-compose.yml logs --tail=80 web || true
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo "Deployment succeeded: http://127.0.0.1:${APP_PORT}"
        }
        failure {
            script {
                dir('docker') {
                    sh '''
                        echo '=== Deploy failed - container status ==='
                        ${COMPOSE_CMD} -f docker-compose.yml ps || true
                        echo '=== Web logs ==='
                        ${COMPOSE_CMD} -f docker-compose.yml logs --tail=60 web || true
                    '''
                }
            }
        }
    }
}