#include <UTFT.h>
extern uint8_t Ubuntu[];
UTFT myGLCD(CTE32HR,38,39,40,41);

const int LINE = 32;
String serialData;
String output[10];

void setup(){
  Serial.begin(9600);
  myGLCD.InitLCD();
  //myGLCD.setContrast(2); //0-64
  myGLCD.setBrightness(2); //0-16
  myGLCD.clrScr();
  myGLCD.setColor(250,250,250);
  myGLCD.setBackColor(0, 0, 0);
  myGLCD.setFont(Ubuntu);
  myGLCD.print("Initializing...", LEFT, LINE*0);
}

void writeScreen(){
  myGLCD.clrScr();
  for (int i=0; i<10; i++){
    myGLCD.print(output[i], LEFT, LINE*i);
  }
}

void loop(){
  int r=0, t=0;
  if(Serial.available()){
    serialData = Serial.readStringUntil('\n');
    //Clear ouptut array for next input
    for(int n=0; n<10; n++){
     output[n]="";
    }

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
