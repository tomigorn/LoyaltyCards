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

        stage('🐳 Build Docker Image') {
            steps {
                script {
                    // Get latest git tag (e.g., v0.1.5 or 0.1.5)
                    def latestTag = sh(
                        script: "git describe --tags --abbrev=0 2>/dev/null || echo 'v0.1.0'",
                        returnStdout: true
                    ).trim()
                    
                    // Remove 'v' prefix if present
                    def baseVersion = latestTag.replaceFirst(/^v/, '')
                    
                    // Use Jenkins BUILD_NUMBER as the patch increment
                    def dockerVersion = "${baseVersion}.${env.BUILD_NUMBER}"
                    
                    echo "Latest git tag: ${latestTag}"
                    echo "Base version: ${baseVersion}"
                    echo "Docker image version: ${dockerVersion}"
                    
                    dir('Backend') {
                        // Build Docker image with incremental version
                        sh """
                            docker build \
                                -t loyaltycardsbackend:${dockerVersion} \
                                -t loyaltycardsbackend:${baseVersion}-latest \
                                -t loyaltycardsbackend:latest \
                                -f LoyaltyCards.API/Dockerfile \
                                .
                        """
                    }
                    
                    echo "Docker image built successfully: loyaltycardsbackend:${dockerVersion}"
                }
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
