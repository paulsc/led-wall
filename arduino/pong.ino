#include <Rainbowduino.h>

unsigned char x = 4;
unsigned char y = 4;
int incomingByte = 0;   // for incoming serial data

void setup()
{
  Rb.init();
  Serial.begin(9600);
  Serial.println("Hello Computer");  
}


void loop()
{
    if (Serial.available() > 0) {
      // read the incoming byte:
      incomingByte = Serial.read();

      // say what you got:
      Serial.print("I received: ");
      Serial.println(incomingByte, DEC);
      
      if (incomingByte == 85) { // U
        x = (x + 1) % 8;
      }
      else if (incomingByte == 76) { // L
        y = (y - 1) % 8;
      }
      else if (incomingByte == 82) { // R
        y = (y + 1) % 8;
      }
      else if (incomingByte == 68) { // D
        x = (x - 1) % 8;
      }
    } 
  
    Rb.setPixelXY(x,y,0xFF,0xFF,0xFF); //uses R, G and B bytes

    delay(100);
    Rb.blankDisplay();
}


