#!/bin/sh

gcc -Wall -o hidtest -L/usr/local/lib -I/usr/local/include/hidapi hidtest.c -pthread -lhidapi-libusb -ludev -lusb-1.0
