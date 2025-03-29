#include <UTFT.h>
extern uint8_t Ubuntu[];
extern uint8_t BigFont[];
extern unsigned int tux[0x400];
UTFT myGLCD(CTE32HR,38,39,40,41);

int cur = 0;
String serialData;
String output[15];
bool firstLine = true;

void setup(){
  Serial.begin(9600);
  myGLCD.InitLCD();
  //myGLCD.setContrast(2); //0-64
  myGLCD.setBrightness(2); //0-16
  myGLCD.clrScr();
  myGLCD.setColor(250,250,250);
  myGLCD.setBackColor(0, 0, 0);
  //myGLCD.setFont(Ubuntu);
  myGLCD.setFont(BigFont);
  myGLCD.print("Initializing...", LEFT, cur);
  myGLCD.drawBitmap (480-48, 0, 48, 48, tux, 1);
}

void writeScreen(){
  myGLCD.clrScr();
  myGLCD.drawBitmap (480-48, 0, 48, 48, tux, 1);
  for (int i=0; i<15; i++){
    String final = output[i];
    char myChar = final[0];
    Serial.println(myChar);
    if(final[0] =='%'){
      if(final[1]== '0'){
        final.remove(0,2);
        myGLCD.setFont(Ubuntu);
        myGLCD.print(final, LEFT, cur);
        cur = cur + 32;
      }
      else if(final[1]== '1'){
        final.remove(0,2);
        myGLCD.setFont(BigFont);
        myGLCD.print(final, LEFT, cur);
        cur=cur + 16;
      }
      else if(final[1]== '2'){
        final.remove(0,2);
        cur=cur + 8;
      }

      Serial.println(cur);
      firstLine = false;
    }
  }
}

void loop(){
  int r=0, t=0;
  if(Serial.available()){
    serialData = Serial.readStringUntil('\n');
    //Clear ouptut array for next input
    for(int n=0; n<15; n++){
     output[n]="";
    }
    firstLine=true;
    cur=0;

    for (int i=0; i < serialData.length(); i++) {
     if(serialData.charAt(i) == ';') {
        output[t] = serialData.substring(r, i);
        r=(i+1);
        t++;
      }
    }

    writeScreen();
  }
}
