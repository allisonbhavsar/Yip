FROM ubuntu:18.04
ENV DEBIAN_FRONTEND=noninteractive

# Install packages
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get -y install git curl wget build-essential \
    && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
    && apt-get install -y nodejs \
    && wget "https://static.rust-lang.org/rustup/rustup-init.sh" \
    && chmod +x ./rustup-init.sh \
    && ./rustup-init.sh -y --default-toolchain nightly \
    && PATH=$PATH:$HOME/.cargo/bin\
    && touch /etc/apt/sources.list.d/pgdg.list \
    && chmod 666 /etc/apt/sources.list.d/pgdg.list \
    && echo "deb http://apt.postgresql.org/pub/repos/apt/ bionic-pgdg main" >> /etc/apt/sources.list.d/pgdg.list \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-12 pgadmin4 libpq-dev libmysqlclient-dev \
    && cargo install diesel_cli --no-default-features --features postgres 

# Adds cargo to PATH
ENV PATH=$PATH:/root/.cargo/bin

# Setups up npm packages and diesel
CMD cd frontend \
    && npm i \
    && cd ../backend \
    && diesel setup \ 
    && cd ..

# Allows access to port 8000
EXPOSE 8000