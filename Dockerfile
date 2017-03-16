FROM node:6.10

COPY . /mnt/app
WORKDIR /mnt/app

RUN npm install --production

CMD ["npm", "start"]
