FROM php:8.2-fpm-alpine
ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=45c0745fb9bb09f8b0317a13948d558a
RUN apk update && apk add --update nodejs npm \
    composer php-pdo_sqlite php-pdo_mysql php-pdo_pgsql php-simplexml php-fileinfo php-dom php-tokenizer php-xml php-xmlwriter php-session \
    openrc bash nginx

RUN docker-php-ext-install pdo

COPY --chown=www-data:www-data web /app
WORKDIR /app

# Overwrite default nginx config
COPY web/nginx.conf /etc/nginx/nginx.conf

# Use the default production configuration
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

RUN composer install

RUN cd frontend && npm install && npm run build
RUN composer build
ENTRYPOINT [ "/app/entrypoint.sh" ]