pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.jenkins.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                // Fetch latest code from GitHub
                git branch: 'main',
                    url: 'https://github.com/hexakaleem/paperbank'
            }
        }

        stage('Build') {
            steps {
                echo 'Building containers...'
                sh 'docker-compose -f ${COMPOSE_FILE} build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Stopping old containers if any...'
                sh 'docker-compose -f ${COMPOSE_FILE} down || true'

                echo 'Starting application...'
                sh 'docker-compose -f ${COMPOSE_FILE} up -d'

                echo 'Waiting for services to be ready...'
                sh 'docker wait paperbank-jenkins-frontend-build'
                sh 'sleep 5'

                echo 'Application deployed successfully!'
                sh 'docker-compose -f ${COMPOSE_FILE} ps'
            }
        }

        stage('Test') {
            steps {
                echo 'Executing Selenium Automated Tests in Docker container...'
                sh '''
                    docker run --rm \
                        --shm-size="2g" \
                        --network container:paperbank-jenkins-frontend \
                        -v ${WORKSPACE}/selenium-tests:/app \
                        -w /app \
                        markhobson/maven-chrome mvn clean test -Dapp.url=http://localhost:4000
                '''
            }
        }
    }

    post {
        always {
            node {
                script {
                    try {
                        def commitEmail = sh(script: "git log -1 --pretty=format:'%ae'", returnStdout: true).trim()
                        def subject = "Jenkins Pipeline Status: ${currentBuild.fullDisplayName}"
                        def body = "Pipeline finished with status: ${currentBuild.currentResult}\\n\\n" +
                                   "Please check the Jenkins console output for details."

                        emailext (
                            to: commitEmail,
                            subject: subject,
                            body: body,
                            attachLog: true
                        )
                        echo "Email notification sent to ${commitEmail}"
                    } catch (Exception e) {
                        echo "Could not send email or fetch git log. Error: ${e.message}"
                    }
                }
            }
        }
        success {
            echo 'Pipeline completed successfully! App is running on port 4000.'
        }
        failure {
            node {
                echo 'Pipeline failed. Cleaning up...'
                sh 'docker-compose -f ${COMPOSE_FILE} down || true'
            }
        }
    }
}
