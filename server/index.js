#!/usr/bin/env node

import { SerialPort } from 'serialport';
import si from 'systeminformation';

const serialPort = new SerialPort({path:"/dev/ttyACM0", baudRate: 9600});
let ipAddr= "0.0.0.0";
let cpuTemp = "0 C";
let time = "00:00";
let memory = "0 Mb / 0 Mb";
let system = "";
let cpu = "";
let os = "";
let drive = "";

const padTo2Digits = (num) => {
  return num.toString().padStart(2, '0');
}

serialPort.on("open", () => {
  console.log("Serial is ready, wait 2 sec for initialization...");

  const getData = async () => {
    const date = new Date(si.time().current);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    time = `${padTo2Digits(hours)}:${padTo2Digits(minutes)}`;

    cpuTemp = await si.cpuTemperature();
    cpuTemp = cpuTemp.main + " C";
    
    ipAddr = await si.networkInterfaces();
    ipAddr = ipAddr[1].ip4;

    memory = await si.mem();
    memory = `${(memory.used/1000000000).toFixed(1)}/${(memory.total/1000000000).toFixed(1)} GB`;

    system = await si.system();
    system = `${system.version}`; //${system.manufacturer}

    cpu = await si.cpu();
    cpu = `${cpu.speed}/${cpu.speedMax} Ghz`;

    os = await si.osInfo();
    os = `${os.distro} ${os.release}`;

    drive = await si.fsSize();
    drive = `${(drive[0].used/1000000000).toFixed(1)}/${(drive[0].size/1000000000).toFixed(1)} GB`;

    console.log("data received", time, cpuTemp, ipAddr, memory, system, cpu, os);
  }

  const updateData = () => {
    serialPort.write(`IP:${ipAddr};;OS:${os};SYS:${system};CPU:${cpu};MEM:${memory};DRV:${drive};TMP:${cpuTemp};;TME:${time};\n`);
  }

  setInterval(async() => {
    await getData();
    console.log("Sending data update.");
    updateData();
  }, 60000); // Update every minute

  setTimeout(async()=>{
    await getData();
    console.log("Sending data first.");
    updateData();
  }, 2000);
});