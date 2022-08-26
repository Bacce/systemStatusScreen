#!/usr/bin/env node

import { SerialPort } from 'serialport';
import si from 'systeminformation';

const serialPort = new SerialPort({path:"/dev/ttyACM0", baudRate: 9600});
let ipAddr= "0.0.0.0";
let cpuTemp = "0 C";
let time = "00:00";

serialPort.on("open", () => {
  console.log("Serial is ready, wait 2 sec for initialization...");

  const getData = async () => {
    time = new Date(si.time().current).toLocaleTimeString();

    cpuTemp = await si.cpuTemperature();
    cpuTemp = cpuTemp.main + " C";
    
    ipAddr = await si.networkInterfaces();
    ipAddr = ipAddr[1].ip4;

    console.log("data received", time, cpuTemp, ipAddr);
  }
  
  const updateData = () => {
    serialPort.write(`Time: ${time};IP: ${ipAddr};CPU Temp: ${cpuTemp};\n`);
  }

  setInterval(async() => {
    await getData();
    console.log("Sending data update.");
    updateData();
  }, 10000);

  setTimeout(async()=>{
    await getData();
    console.log("Sending data first.");
    updateData();
  }, 2000);
});