# ---- build stage (real app build added in Milestone 1) ----
FROM node:22-alpine AS build
WORKDIR /app
# Skeleton: no app yet; copy the static placeholder as the build output.
COPY public/ ./dist/

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
