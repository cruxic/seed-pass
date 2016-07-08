 /* Basic Raw HID Example
   Teensy can send/receive 64 byte packets with a
   dedicated program running on a PC or Mac.

   You must select Raw HID from the "Tools > USB Type" menu

   Optional: LEDs should be connected to pins 0-7,
   and analog signals to the analog inputs.

   This example code is in the public domain.
*/


void setup() {
  Serial.begin(9600);
Serial.println(F("RawHID Example"));
}

enum {
  Cmd_unknown = 0,
  Cmd_echo,
  Cmd_install_seed,
  Cmd_hmac_sha256,
};

typedef struct {
  byte type;  //see enum Cmd_*
  byte crc8;
  byte data[62];
} HIDPacket;

/*byte crc8(const void *vptr, int len)
{
  const uint8_t *data = vptr;
  unsigned crc = 0;
  int i, j;
  for (j = len; j; j--, data++) {
    crc ^= (*data << 8);
    for(i = 8; i; i--) {
      if (crc & 0x8000)
        crc ^= (0x1070 << 3);
      crc <<= 1;
    }
  }
  return (uint8_t)(crc >> 8);
}*/

// RawHID packets are always 64 bytes
HIDPacket gPacket;
//elapsedMillis msUntilNextSend;
//unsigned int packetCount = 0;

void loop() {
  int n;
  /*if (msUntilNextSend > 1000) {
    msUntilNextSend = msUntilNextSend - 1000;
    
    for (n = 0; n < 64; n++) {
      buffer[n] = (byte)(n + 1);
    }

    n = RawHID.send(buffer, 100);
    if (n > 0)
      Serial.print(F("Sent packet "));

    
  }*/
  
  n = RawHID.recv((*byte)&gPacket, 0); // 0 timeout = do not wait
  if (n > 0) {
    Serial.print(F("Got packet"));

    //TODO: check crc

    //
    switch (gPacket.type) {
      case Cmd_hmac_sha256:
                
        break;      
    }

    
    
    n = RawHID.send(buffer, 100);
    if (n > 0)
      Serial.print(F("Sent packet "));
  }
  
}
