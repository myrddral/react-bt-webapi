import { useState } from "react";

const App = () => {
  const [reading, setReading] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

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
    setIsConnected(false);
  };

  const connectToScale = () => {
    isWebBluetoothEnabled();
    navigator.bluetooth
      .requestDevice(filters)
      .then((device) => {
        setIsConnected(true);
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
          .then((characteristic) => handleScaleMeasurement(characteristic)),
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
    console.log(characteristic);
    console.log("Starting notifications for measurement...");
    return characteristic
      .startNotifications()
      .then((characteristic) => {
        console.log("Adding event listener for measurement...");
        characteristic.addEventListener(
          "characteristicvaluechanged",
          onCharacteristicValueChanged
        );
      })
      .catch((error) => console.error(error));
  }

  const onCharacteristicValueChanged = (event) => {
    console.log(`READING: ${event.target.value.getUint8(0)}`);
    setReading(event.target.value.getUint8(0));
  };

  return (
    <>
      <center style={{ paddingTop: 50 }}>
        <p>{isConnected ? "CONNECTED" : "NOT CONNECTED"}</p>
        <h2>{reading ? { reading } : "No reading yet"}</h2>
        {!isConnected && (
          <button onClick={connectToScale}>CONNECT TO SCALE</button>
        )}
      </center>
    </>
  );
};

export default App;
