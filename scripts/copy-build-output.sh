#!/bin/bash -e

print_heading() {
    echo
    printf "%0.s$1" $(seq 1 ${#2})
    echo
    echo "$2"
    printf "%0.s$1" $(seq 1 ${#2})
    echo
    echo
}

copy_build_output() {
    print_heading "=" "Copying build output to $(pwd)/build_output"

    mkdir -p build_output/node_modules/.bin
    mkdir -p build_output/apps/agenda-worker/
    mkdir -p build_output/apps/trpc-server/
    mkdir -p build_output/apps/web/.next/
    mkdir -p build_output/packages/mailer/

    print_heading "*" "Copying package.json"

    cp -vR package*.json build_output/
    cp -vR apps/agenda-worker/package.json build_output/apps/agenda-worker/
    cp -vR apps/trpc-server/package.json build_output/apps/trpc-server/
    cp -vR apps/web/package.json build_output/apps/web/

    print_heading "*" "Copying dist"

    cp -vR apps/agenda-worker/dist build_output/apps/agenda-worker/
    cp -vR apps/trpc-server/dist build_output/apps/trpc-server/
    cp -vR apps/web/.next build_output/apps/web/
    cp -vR packages/mailer build_output/packages/mailer

    print_heading "*" "Copying node_modules"

    cd node_modules
    cp -vR .bin/turbo .bin/prisma ../build_output/node_modules/.bin/
    cp -vR .prisma *prisma turbo* ../build_output/node_modules/
    cd ..

    print_heading "*" "Copying other files"

    cp -vR data build_output/
    cp -vR prisma build_output/
    cp -vR scripts build_output/
    cp -vR turbo.json build_output/

    print_heading "=" "$(du -sh build_output | expand)"
}

mkdir -p build_output
copy_build_output >build_output/export-build-output.log 2>&1
