# EasyPanel builds frontend/Dockerfile and backend/Dockerfile.
# This file stays so an old root build cannot bake a database URL into an image.
FROM node:20-alpine
CMD ["node", "-e", "console.error('Build frontend/Dockerfile or backend/Dockerfile'); process.exit(1)"]
