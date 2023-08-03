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
	let memPercent = (memory.total/100);
	let usedPercent = memory.used/memPercent;
	let memFree = ((memory.total - memory.used)/1000000000).toFixed(1); //Gb
        let freePercent = (100-usedPercent).toFixed(1);

    memory = `${memFree}Gb ${freePercent}% free`;
   // memory = `${(memory.used/1000000000).toFixed(1)}/${(memory.total/1000000000).toFixed(1)} GB`;

    system = await si.system();
    system = `${system.manufacturer} ${system.version}`;

    cpu = await si.cpu();
    cpu = `${cpu.speed}/${cpu.speedMax} Ghz`;

    os = await si.osInfo();
    os = `${os.distro} ${os.release}`;

    drive = await si.fsSize();
    let drivePercent = drive[0].size/100;
    let driveUsedPercent = (100-(drive[0].used/drivePercent)).toFixed(1);
    let driveFreeSize = ((drive[0].size - drive[0].used)/1000000000).toFixed(1); //GB
    drive = `${driveFreeSize}Gb ${driveUsedPercent}% free`;
//    drive = `${(drive[0].used/1000000000).toFixed(1)}/${(drive[0].size/1000000000).toFixed(1)} GB`;

    console.log("data received", time, cpuTemp, ipAddr, memory, system, cpu, os);
  }

  const updateData = () => {
    serialPort.write(`%2;%1SYS:${system};%1OS: ${os};%1;%0IP: ${ipAddr};%1;%1Drive;%0${drive};%1;%1Memory;%0${memory};%1;%1CPU: ${cpu};%0;%0TMP:${cpuTemp} TIME:${time};\n`);
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

process.on('SIGINT', () => {
    serialPort.write(`%0Server stoped.;\n`);
    process.exit();
});

process.on('exit', () => {
    serialPort.write(`%0Shutting down...;\n`);
    process.exit();
});
