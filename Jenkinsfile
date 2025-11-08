pipeline {
    agent any

    environment {
        ENVIRONMENT = "dev"
    }

    stages {
        stage('🚀 Checkout & Verify') {
            steps {
                echo "Environment: ${ENVIRONMENT}"
                echo "Workspace: ${WORKSPACE}"
                echo "Branch: ${env.BRANCH_NAME}"
                
                // List workspace contents
                sh 'pwd'
                sh 'ls -la'
            }
        }

        stage('📋 Check Project Structure') {
            steps {
                echo "Checking Backend structure..."
                sh 'ls -la Backend/ || echo "Backend directory not found"'
                
                echo "Checking Mobile structure..."
                sh 'ls -la Mobile/mobile/ || echo "Mobile/mobile directory not found"'
            }
        }

        stage('✅ Pipeline Test Complete') {
            steps {
                echo "Basic pipeline is working!"
                echo "Ready to add build steps incrementally."
            }
        }
    }

    post {
        success {
            echo "✅ Minimal pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed - check logs above"
        }
    }
}
