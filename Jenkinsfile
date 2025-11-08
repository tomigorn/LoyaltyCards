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

        stage('🏗️ Build Backend (.NET)') {
            agent {
                docker {
                    image 'mcr.microsoft.com/dotnet/sdk:8.0'
                    reuseNode true
                }
            }
            steps {
                echo "Building Backend for environment: ${ENVIRONMENT}"
                
                dir('Backend') {
                    sh 'dotnet --version'
                    sh 'dotnet restore'
                    sh 'dotnet build --configuration Release --no-restore'
                }
                
                echo "Backend build completed!"
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
