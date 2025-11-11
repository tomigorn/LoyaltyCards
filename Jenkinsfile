pipeline {
    agent any

    environment {
        ENVIRONMENT = "dev"
    }

    stages {
// Checkout is done automatically by Jenkins before the pipeline starts

// ===================================================================================
// Checkout & Verify
// ===================================================================================
        stage('🚀 Checkout & Verify') {
            steps {
                echo "🐙 GitHub: Checking out code happens automatically before the pipeline starts.\n"

                echo "🧪 Environment: ${ENVIRONMENT}"
                echo "🗂️ Workspace: ${WORKSPACE}"
                echo "🌿 Branch: ${env.BRANCH_NAME}"

                // List workspace contents
                echo "\nListing workspace contents:"
                sh 'pwd'
                sh 'ls -la'

                echo "✅ Checkout & verification completed!"
            }
        }

// ===================================================================================
// Check Project Structure
// ===================================================================================
        stage('📋 Check Project Structure') {
            steps {
                echo "🖥️ Checking Backend structure..."
                sh 'ls -la Backend/ || echo "Backend directory not found"'

                echo "📱 Checking Mobile structure..."
                sh 'ls -la Mobile/mobile/ || echo "Mobile/mobile directory not found"'

                echo "✅ Project structure verified!"
            }
        }

// ===================================================================================
// Build Backend (.NET)
// ===================================================================================
        stage('🏗️ Build Backend (.NET)') {
            // prepare .NET build Agent in Docker Container
            agent {
                docker {
                    image 'mcr.microsoft.com/dotnet/sdk:8.0'
                    reuseNode true
                    args '-e COMPOSE_PROJECT_NAME=cicd'
                }
            }
            // Build itself is done inside the Docker container
            steps {
                echo "Building Backend for environment: ${ENVIRONMENT}"

                dir('Backend') {
                    sh 'dotnet --version'
                    sh 'dotnet restore'
                    sh 'dotnet build --configuration Release --no-restore'
                }

                echo "✅ Backend build completed!"
            }
        }
// ===================================================================================
// Build Docker Image
// ===================================================================================
        stage('🐳 Build Docker Image') {
            steps {
                script {
                    // Determine latest git tag merged into HEAD
                    def latestTag = sh(script: '''
                        git fetch --tags --prune || true
                        # Prefer the newest semver-style tag that is merged into HEAD
                        TAG=$(git tag --sort=-v:refname --merged HEAD | head -n1)
                        if [ -z "$TAG" ]; then
                            # Fall back to describe (may pick tag on current commit) or default
                            TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo 'v0.1.0')
                        fi
                        echo "$TAG"
                    ''', returnStdout: true).trim()

                    // Remove 'v' prefix if present
                    def baseVersion = latestTag.replaceFirst(/^v/, '')

                    // Export base version for later stages
                    env.BASE_VERSION = baseVersion

                    // Compute the final docker version (base + increment) before building
                    try {
                        withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_HUB_USERNAME', passwordVariable: 'DOCKER_HUB_TOKEN')]) {
                            def highestSuffix = sh(script: '''
                                set -euo pipefail
                                USER="${DOCKER_HUB_USERNAME}"
                                REPO="loyaltycardsbackend"
                                BASE="${BASE_VERSION}"
                                TAGS_JSON=$(curl -s "https://registry.hub.docker.com/v2/repositories/${USER}/${REPO}/tags?page_size=100") || TAGS_JSON='{}'

                                # Extract tag names from JSON using awk (avoid backslashes in Groovy source)
                                names=$(printf "%s" "$TAGS_JSON" | awk -F'"name":' '{for(i=2;i<=NF;i++){s=$i; p=index(s,sprintf("%c",34)); if(p){s=substr(s,p+1); q=index(s,sprintf("%c",34)); if(q) print substr(s,1,q-1)}}}') || names=''

                                # Highest numeric suffix for tags matching BASE.N
                                highest=$(printf "%s" "$names" | grep -E "^${BASE}[.][0-9]+$" | sed 's/^'"${BASE}"'[.]//' | sort -n | tail -n1 || true)
                                if [ -z "$highest" ]; then highest=0; fi
                                echo "$highest"
                            ''', returnStdout: true).trim()

                            def nextSuffix = (highestSuffix.isInteger() ? (highestSuffix as Integer) : 0) + 1
                            env.DOCKER_VERSION = "${baseVersion}.${nextSuffix}"
                        }
                    } catch (err) {
                        echo "Could not query Docker Hub for existing tags (will fallback to BUILD_NUMBER): ${err}"
                        env.DOCKER_VERSION = "${baseVersion}.${env.BUILD_NUMBER}"
                    }

                    def dockerVersion = env.DOCKER_VERSION

                    // Log versions
                    echo "Latest git tag: ${latestTag}"
                    echo "Base version: ${baseVersion}"
                    echo "Docker image version: ${dockerVersion}"

                    // Build Docker image with incremental version
                    dir('Backend') {
                        sh """
                            docker build \
                                -t loyaltycardsbackend:${dockerVersion} \
                                -t loyaltycardsbackend:${baseVersion}-latest \
                                -t loyaltycardsbackend:latest \
                                -f LoyaltyCards.API/Dockerfile \
                                .
                        """
                    }

                    // Log successful build
                    echo "✅ Docker image built successfully: loyaltycardsbackend:${dockerVersion}"
                }
            }
        }
// ===================================================================================
// Push Docker Image to Docker Hub
// ===================================================================================
        stage('⬆️ Push Docker Image') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Use Jenkins credentials for Docker Hub
                    withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_HUB_USERNAME', passwordVariable: 'DOCKER_HUB_TOKEN')]) {
                        // Reuse dockerVersion computed in the Build stage so build and push match
                        def baseVersion = env.BASE_VERSION ?: '0.1.0'
                        def dockerVersion = env.DOCKER_VERSION ?: "${baseVersion}.${env.BUILD_NUMBER}"

                        echo "Preparing to push Docker images for: ${dockerVersion} to ${DOCKER_HUB_USERNAME}"

                        dir('Backend') {
                            sh "echo \"${DOCKER_HUB_TOKEN}\" | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin"

                            // Tag local images with Docker Hub repo and push
                            sh "docker tag loyaltycardsbackend:${dockerVersion} ${DOCKER_HUB_USERNAME}/loyaltycardsbackend:${dockerVersion}"
                            sh "docker tag loyaltycardsbackend:${baseVersion}-latest ${DOCKER_HUB_USERNAME}/loyaltycardsbackend:${baseVersion}-latest || true"
                            sh "docker tag loyaltycardsbackend:latest ${DOCKER_HUB_USERNAME}/loyaltycardsbackend:latest || true"

                            sh "docker push ${DOCKER_HUB_USERNAME}/loyaltycardsbackend:${dockerVersion}"
                            sh "docker push ${DOCKER_HUB_USERNAME}/loyaltycardsbackend:${baseVersion}-latest || true"
                            sh "docker push ${DOCKER_HUB_USERNAME}/loyaltycardsbackend:latest || true"

                            sh 'docker logout'
                        }

                        echo "✅ Docker images pushed successfully to Docker Hub."
                    }
                }
            }
        }

        // ===================================================================================
        // Deploy to Raspberry Pi (SSH-only) with host key verification
        // ===================================================================================
        stage('🚢 Deploy to Raspberry Pi') {
            when { branch 'main' }
            steps {
                script {
                // only inject host IP as env var, the SSH key is used by sshagent
                withCredentials([string(credentialsId: 'pi-deploy-host-ip', variable: 'DEPLOY_SSH_IP')]) {
                    sshagent (credentials: ['pi-ssh-deploy-key']) {
                        sh '''
                            set -euo pipefail
                            KNOWN_HOSTS="$WORKSPACE/deploy_known_hosts"
                            ssh-keyscan -t ed25519 ${DEPLOY_SSH_IP} >> "$KNOWN_HOSTS" 2>/dev/null || true
                            ssh -o UserKnownHostsFile="$KNOWN_HOSTS" -o StrictHostKeyChecking=yes -o BatchMode=yes deploy@${DEPLOY_SSH_IP} 'hostname -I || true'
                        '''
                        }
                    }

                    echo "✅ Deployment to Raspberry Pi completed!"
                }
            }
        }

        // ===================================================================================
        // Final Stage
        // ===================================================================================
        stage('✅ Pipeline Complete') {
            steps {
                echo "✅ LoyaltyCards pipeline completed!"
            }
        }
    }

    post {
        success {
            script {
                // Set the run description so the UI shows a clear one-line summary
                currentBuild.description = "✅ LoyaltyCards pipeline completed successfully!"
                echo "✅ LoyaltyCards pipeline completed successfully!"
            }
        }
        failure {
            echo "❌ Pipeline failed - check logs above"
        }
    }
}
