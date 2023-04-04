FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install mongoose
COPY . .

CMD npx nodemon server.js