
const WS_URI = `${window?.location?.protocol === 'https:' ? 'wss' : 'ws'}://${window?.location?.host ?? 'localhost:8080'}`;
const ws = new WebSocket(WS_URI);

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  switch (msg.event) {
    case 'log':
      const logOutput = document.getElementById('logOutput');
      if (logOutput) {
        if (msg.newLine) {
          const div = document.createElement('div');
          div.className = 'w-full text-gray-700 italic';
          div.innerText = msg.message;
          logOutput.appendChild(div);
          logOutput.scrollTop = logOutput.scrollHeight;
        } else {
          const lastLog = document.querySelector('#logOutput > div:last-of-type');
          lastLog.innerText = lastLog.innerText + ' ' + msg.message;
        }
      }
      break;
    case 'next':
      // show next step
      const saveFilteredRoms = document.getElementById('saveFilteredRoms');
      saveFilteredRoms.classList.remove("hidden");
      const changeFilters = document.getElementById('changeFilters');
      changeFilters.classList.remove("hidden");
      break;
    case 'finish':
      // hide button for re-run
      const elem = document.getElementById('saveFilteredRoms');
      elem.classList.add("hidden");
      break;
    default:
      console.log('untreated event', msg);
      break;
  }
}

function wsSendMessage (args) {
  ws.send(JSON.stringify(args));
}