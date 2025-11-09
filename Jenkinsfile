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
                    args '-e COMPOSE_PROJECT_NAME=cicd'
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
                    // Ensure tags are fetched and find the latest tag reachable from this branch's history.
                    // Jenkins' lightweight checkout may not fetch tags, and the pipeline runs on a detached
                    // commit for the pushed revision. Fetch tags and prefer the most recent tag merged into
                    // HEAD (branch history). Fall back to the most recent tag by describe or a default.
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

        stage('⬆️ Push Docker Image') {
            steps {
                script {
                    // Use Jenkins credentials (add a username/password credential with id 'docker-hub')
                    // Username -> DOCKER_HUB_USERNAME, Password -> DOCKER_HUB_TOKEN
                    withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_HUB_USERNAME', passwordVariable: 'DOCKER_HUB_TOKEN')]) {
                        // Recalculate base version (same logic as build stage)
                        def latestTag = sh(script: '''
                            git fetch --tags --prune || true
                            TAG=$(git tag --sort=-v:refname --merged HEAD | head -n1)
                            if [ -z "$TAG" ]; then
                                TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo 'v0.1.0')
                            fi
                            echo "$TAG"
                        ''', returnStdout: true).trim()
                        def baseVersion = latestTag.replaceFirst(/^v/, '')

                        // Query Docker Hub to find the highest existing suffix for this baseVersion
                        // and increment it. If no existing tags, start at .1
                        // This uses the Docker Hub tags API (first page only). Adjust paging if needed.
                        def highestSuffix = sh(script: '''
                            set -e
                            USER="${DOCKER_HUB_USERNAME}"
                            REPO="loyaltycardsbackend"
                            BASE="${baseVersion}"
                            # Fetch first page of tags (public repos). Output tag names one per line.
                            TAGS_JSON=$(curl -s "https://registry.hub.docker.com/v2/repositories/${DOCKER_HUB_USERNAME}/${REPO}/tags?page_size=100") || TAGS_JSON='{}'
                            python3 - <<'PY'
                            import sys, json, re
                            data = json.loads(sys.stdin.read() or '{}')
                            names = [r.get('name') for r in data.get('results', []) if r.get('name')]
                            base = sys.argv[1]
                            regex = re.compile(r'^' + re.escape(base) + r'\.([0-9]+)$')
                            nums = [int(regex.match(n).group(1)) for n in names if regex.match(n)]
                            print(max(nums) if nums else 0)
                            PY
                        ''', returnStdout: true).trim()

                        def nextSuffix = (highestSuffix.isInteger() ? (highestSuffix as Integer) : 0) + 1
                        def dockerVersion = "${baseVersion}.${nextSuffix}"

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
                    }
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
