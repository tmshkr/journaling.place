FROM mongo:8

RUN apt-get update && apt-get install -y curl unzip sudo

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN sudo ./aws/install

COPY wrapper.sh /usr/local/bin/
ENTRYPOINT ["wrapper.sh"]
