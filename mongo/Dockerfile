# https://stackoverflow.com/a/73778367/8229853
FROM mongo:7
RUN echo "password" > /keyfile \
  && chmod 600 /keyfile \
  && chown 999 /keyfile \
  && chgrp 999 /keyfile
CMD ["--bind_ip_all", "--keyFile", "/keyfile", "--replSet", "rs0"]