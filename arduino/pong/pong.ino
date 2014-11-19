#include <Rainbowduino.h>

unsigned char x1 = 4;
unsigned char x2 = 4;

unsigned char ball_x = 7;
unsigned char ball_y = 1;

int incomingByte = 0;   // for incoming serial data

void setup()
{
  Rb.init();
  Serial.begin(115200);
  Serial.println("Hello Computer");  
}


void loop()
{
    if (Serial.available() > 0) {
      // read the incoming byte:
      incomingByte = Serial.read();

      // say what you got:
      //Serial.print("I received: ");
      //Serial.println(incomingByte, DEC);
      
      if (incomingByte == 65 && Serial.available() > 0) { //A
        incomingByte = Serial.read();
        x1 = incomingByte - 48;
      }

      if (incomingByte == 66 && Serial.available() > 0) { //B
        incomingByte = Serial.read();
        x2 = incomingByte - 48;
      }

      if (incomingByte == 88 && Serial.available() > 0) { //B
        incomingByte = Serial.read();
        ball_x = incomingByte - 48;
        if (Serial.available() > 0) {
          incomingByte = Serial.read();
          ball_y = incomingByte - 48; 
        }
      }

    } 
  
    Rb.setPixelXY(x1,0,0xFF,0xFF,0xFF); //uses R, G and B bytes
    Rb.setPixelXY(x1-1,0,0xFF,0xFF,0xFF); //uses R, G and B bytes
    Rb.setPixelXY(x1+1,0,0xFF,0xFF,0xFF); //uses R, G and B bytes

    Rb.setPixelXY(x2,7,0xFF,0xFF,0xFF); //uses R, G and B bytes
    Rb.setPixelXY(x2-1,7,0xFF,0xFF,0xFF); //uses R, G and B bytes
    Rb.setPixelXY(x2+1,7,0xFF,0xFF,0xFF); //uses R, G and B bytes

    Rb.setPixelXY(ball_x,ball_y,0x00,0x00,0xFF); //uses R, G and B bytes

    delay(100);
    Rb.blankDisplay();
}


