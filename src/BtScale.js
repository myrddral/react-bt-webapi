import { useState } from "react";

const BtScale = () => {
  const [reading, setReading] = useState(null);
  const [scaleStatus, setScaleStatus] = useState("disconnected");
  const options = {
    primaryService: "0000780a-0000-1000-8000-00805f9b34fb",
    measurement: "00008aa1-0000-1000-8000-00805f9b34fb",
    intermediateMeasurement: "00008aa2-0000-1000-8000-00805f9b34fb",
  };
  const filters = {
    filters: [
      {
        name: "01136B",
        services: [options.primaryService],
      },
    ],
  };

  function isWebBluetoothEnabled() {
    if (navigator.bluetooth) {
      console.log("BT enabled");
      return true;
    } else {
      console.log(
        "Web Bluetooth API is not available.\n" +
        'Please make sure the "Experimental Web Platform features" flag is enabled.'
      );
      return false;
    }
  }

  const onDisconnected = (event) => {
    console.log(`The device ${event.target.name} is disconnected`);
    setReading(null);
    setScaleStatus("disconnected");
  };

  const connectToScale = () => {
    isWebBluetoothEnabled();
    navigator.bluetooth
      .requestDevice(filters)
      .then((device) => {
        setScaleStatus("connected")
        device.addEventListener("gattserverdisconnected", onDisconnected);
        console.log("Connecting to GATT server...");
        return device.gatt.connect();
      })
      .then((server) => startWeightNotifications(server));
  };

  function startWeightNotifications(server) {
    console.log("Getting characteristics...");
    return server.getPrimaryService(options.primaryService).then((service) => {
      return Promise.all([
        service
          .getCharacteristic(options.intermediateMeasurement)
          .then((characteristic) => {
            //change settimeout for criteria, if known
            setTimeout(() => {
              handleScaleMeasurement(characteristic)
            }, 2000);
          }),
      ]);
    });
  }

  // const readDescriptor = (characteristic) => {
  //   return characteristic.getDescriptors().then((descriptor) => {
  //     console.log(descriptor);
  //     descriptor[0].readValue().then((value) => console.log(value));
  //   });
  // };

  function handleScaleMeasurement(characteristic) {
    console.log("Starting notifications for measurement...");
    return characteristic
      .startNotifications()
      .then((characteristic) => {
        console.log("Adding event listener for measurement...");
        setScaleStatus("initialized")
        characteristic.addEventListener(
          "characteristicvaluechanged",
          onCharacteristicValueChanged
        );
      })
      .catch((error) => console.error(error));
  }

  const onCharacteristicValueChanged = (event) => {
    let weight = event.target.value.getUint8(1);
    weight |= (event.target.value.getUint8(2) << 8);
    weight |= (event.target.value.getUint8(3) << 16);

    setReading(weight);
  };

  const scaleDisplay = () => {
    if (scaleStatus === "initialized" && reading !== null) return `${reading} g`
    else if (scaleStatus === "connected") return "Connecting..."
    else if(scaleStatus === "disconnected") return "Not Connected"
  }
  
  const connectButton = <>
    {scaleStatus === "disconnected" && (
      <button onClick={connectToScale}>CONNECT TO SCALE</button>
    )}
  </>

  return (
    <>
      <center style={{ paddingTop: 50 }}>
        <h1>{scaleDisplay()}</h1>
        {connectButton}
      </center>
    </>
  );
};

export default BtScale;
