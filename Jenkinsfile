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
                sh 'sleep 10'

                echo 'Application deployed successfully!'
                sh 'docker-compose -f ${COMPOSE_FILE} ps'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! App is running on port 4000.'
        }
        failure {
            echo 'Pipeline failed. Cleaning up...'
            sh 'docker-compose -f ${COMPOSE_FILE} down || true'
        }
    }
}
