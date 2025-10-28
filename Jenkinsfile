pipeline {
    agent any

    environment {
        ENVIRONMENT = "dev" // you can later make this a Jenkins parameter
    }

    stages {

        stage('🚀 Starting Pipeline') {
            steps {
                echo "\033[1;34m🌐 Environment:\033[0m ${ENVIRONMENT}"
                echo "\033[1;32m✅ Pipeline initialized. Preparing to build Backend & Mobile...\033[0m"
            }
        }

        stage('🏗️ Build Backend & Mobile') {
            parallel {
                stage('🧩 Build Backend (.NET 8)') {
                    agent { docker { image 'mcr.microsoft.com/dotnet/sdk:8.0' } }
                    steps {
                        script {
                            echo "\033[1;33m🔧 Restoring and building Backend...\033[0m"
                        }
                        dir('Backend') {
                            sh 'dotnet restore'
                            sh 'dotnet build --configuration Release'
                        }
                        script {
                            echo "\033[1;32m✅ Backend build completed successfully!\033[0m"
                        }
                    }
                }

                stage('📱 Build Mobile (Flutter)') {
                    agent { docker { image 'cirrusci/flutter:stable' } }
                    steps {
                        script {
                            echo "\033[1;33m📦 Fetching dependencies & building Flutter app...\033[0m"
                        }
                        dir('Mobile/mobile') {
                            sh 'flutter pub get'
                            sh "flutter build apk --dart-define=ENV=${ENVIRONMENT}"
                        }
                        script {
                            echo "\033[1;32m✅ Flutter build completed successfully!\033[0m"
                        }
                    }
                }
            }
        }

        stage('📦 Archive Build Artifacts') {
            steps {
                echo "\033[1;34m🗂️ Archiving build outputs...\033[0m"
                archiveArtifacts artifacts: '**/build/**', allowEmptyArchive: true
                echo "\033[1;32m✅ Artifacts archived successfully.\033[0m"
            }
        }

        stage('🎉 Build Complete') {
            steps {
                echo "\033[1;32m✨ All builds completed successfully! Ready for deployment or testing.\033[0m"
            }
        }
    }

    post {
        failure {
            echo "\033[1;31m❌ Build failed! Check the logs above for details.\033[0m"
        }
        success {
            echo "\033[1;32m🏁 Pipeline finished successfully — all systems go! 🚀\033[0m"
        }
    }
}
