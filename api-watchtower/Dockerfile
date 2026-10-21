# ── WatchTower API — PHP 8.4-FPM ──────────────────────────────
# PHP-FPM (not `php artisan serve`, which Laravel's own docs call
# development-only) behind nginx — see docker/nginx/default.conf. Same
# pattern as every other Laravel app on this team's infrastructure.
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    bash curl git zip unzip \
    libzip-dev oniguruma-dev libxml2-dev icu-dev \
    linux-headers autoconf g++ make

RUN docker-php-ext-configure intl \
    && docker-php-ext-install \
        pdo pdo_mysql mbstring zip bcmath opcache pcntl xml intl sockets

RUN pecl install redis && docker-php-ext-enable redis

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY . .

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

COPY docker/php-fpm/pool.conf /usr/local/etc/php-fpm.d/www.conf

RUN mkdir -p storage/logs \
             storage/framework/cache \
             storage/framework/sessions \
             storage/framework/views \
             bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
