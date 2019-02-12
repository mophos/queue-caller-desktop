
$(document).ready(async function () {

  var CLIENT;
  var servicePoints = await getServicePoints();
  setServicePoints();

  var QUEUE_ID;
  var QUEUE_NUMBER;
  var ROOM_ID;
  var ROOM_NUMBER;
  var ROOMS = [];
  var QUEUES = [];
  var QUEUES_HISTORY = [];
  var QUEUES_TRANSFER = [];
  var IS_OFFLINE = false;

  async function getServicePoints() {
    var _servicePoints = sessionStorage.getItem('servicePoints');
    return JSON.parse(_servicePoints);
  }

  async function getWorking() {
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    var selected = $('#slServicePoints').val();

    const _url = `${_apiUrl}/queue/working/${selected}`;
    return axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });
  }

  async function getTransfer() {
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    var selected = $('#slServicePoints').val();

    try {
      const _url = `${_apiUrl}/queue/pending/${selected}`;
      var rs = await axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });
      if (rs.data.statusCode === 200) {
        QUEUES_TRANSFER = rs.data.results;
        renderListTransfer(rs.data.results);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getRooms() {
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    var selected = $('#slServicePoints').val();

    const _url = `${_apiUrl}/service-rooms/${selected}`;
    return axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });
  }

  async function callQueue(queueNumber, roomId, roomNumber, queueId, isCompleted = 'Y') {
    var servicePointId = $('#slServicePoints').val();

    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    const _url = `${_apiUrl}/queue/caller/${queueId}`;

    var body = {
      servicePointId: servicePointId,
      queueNumber: queueNumber,
      roomNumber: roomNumber,
      roomId: roomId,
      isCompleted: isCompleted
    }

    return axios.post(_url, body, { headers: { "Authorization": `Bearer ${token}` } });
  }

  async function doTransfer(queueNumber, queueId, servicePointId, transferServicePointId) {
    if (servicePointId === transferServicePointId) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: `ไม่สามารถสร้างคิวในจุดบริการเดียวกันได้`
      });
    } else {
      try {

        var _apiUrl = localStorage.getItem('apiUrl');
        var token = sessionStorage.getItem('token');

        var body = {
          queueId: queueId,
          servicePointId: transferServicePointId
        };

        const _url = `${_apiUrl}/queue/pending`;

        var rs = await axios.post(_url, body, { headers: { "Authorization": `Bearer ${token}` } });

        if (rs.data.statusCode === 200) {
          var queueNumber = rs.data.queueNumber;
          Swal.fire({
            type: 'success',
            title: 'เสร็จเรียบร้อย...',
            text: `คิวใหม่ของคุณคือ ${queueNumber}`
          }).then(() => {
            $('#modalServicePoints').modal('hide');
            getTransfer();
          });

          QUEUE_ID = null;
          QUEUE_NUMBER = null;

          getQueue();
          getHistory();
        } else {
          Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: `เกิดข้อผิดพลาด`
          });
        }
      } catch (error) {
        console.log(error);
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: `เกิดข้อผิดพลาด`
        });
      }
    }
  }

  async function getHistory() {
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    var selected = $('#slServicePoints').val();

    const _url = `${_apiUrl}/queue/working/history/${selected}`;
    var rs = await axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });
    if (rs.data) {
      if (rs.data.results) {
        QUEUES_HISTORY = [];
        QUEUES_HISTORY = rs.data.results;
        renderListHistory(rs.data.results);
      }
    }
  }

  async function getQueue() {
    try {
      var _apiUrl = localStorage.getItem('apiUrl');
      var token = sessionStorage.getItem('token');

      var selected = $('#slServicePoints').val();

      const _url = `${_apiUrl}/queue/waiting/${selected}`;
      const rs = await axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });

      if (rs.data) {
        // clear all queue
        QUEUES = [];
        // set new queues
        QUEUES = rs.data.results;

        var data = rs.data;
        if (data.statusCode === 200) {
          console.log(data.results);
          renderListWaiting(data.results);
        }
      } else {
        alert(rs.message);
      }
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  }

  function setServicePoints() {
    var slTransferServicePoints = $('#slTransferServicePoints');
    slTransferServicePoints.empty();

    $.each(servicePoints, (k, v) => {
      var html = `
        <option value="${v.service_point_id}">${v.service_point_name}</option>
      `;

      slTransferServicePoints.append(html);
    });
  }

  function renderListWaiting(data) {
    var listWaiting = $('#listWaiting');
    listWaiting.empty();

    $.each(data, (k, v) => {
      var html = `
      <li class="list-group-item list-group-item-action flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="text-danger font-weight-bold">${v.queue_number}</h5>
            <h5 class="mb-1">${v.title}${v.first_name} ${v.last_name}</h5>
          </div>
          <div class="d-flex w-100 justify-content-between">
            <div>
              <p class="mb-1">ประเภท: ${v.priority_name}</p>
              <p class="mb-1">เวลา : ${v.time_serv} น.</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-success" data-action="callQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">เรียกคิว</button>
            </div>
          </div>
        </li>
      `;

      listWaiting.append(html);
    });
  }

  function renderListTransfer(data) {
    var listTransfer = $('#listTransfer');
    listTransfer.empty();

    $.each(data, (k, v) => {
      var html = `
      <li class="list-group-item list-group-item-action flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="text-danger font-weight-bold">${v.queue_number}</h5>
            <h5 class="mb-1">${v.title}${v.first_name} ${v.last_name}</h5>
          </div>
          <div class="d-flex w-100 justify-content-between">
            <div>
              <p class="mb-1">ประเภท: ${v.priority_name}</p>
              <p class="mb-1">เวลา : ${v.time_serv} น.</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-success" data-action="callQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">เรียกคิว</button>
            </div>
          </div>
        </li>
      `;

      listTransfer.append(html);
    });
  }

  function renderListHistory(data) {
    var listHistory = $('#listHistory');
    listHistory.empty();

    $.each(data, (k, v) => {
      var html = `
      <li class="list-group-item list-group-item-action flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="text-danger font-weight-bold">${v.queue_number}</h5>
            <h5 class="mb-1">${v.title}${v.first_name} ${v.last_name}</h5>
          </div>
          <div class="d-flex w-100 justify-content-between">
            <div>
              <p class="mb-1">ประเภท: ${v.priority_name}</p>
              <p class="mb-1">เวลา : ${v.time_serv} น.</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-success" data-action="reCallQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">เรียกซ้ำ</button>
              <button data-name="btnTransfer" data-queue-id="${v.queue_id}" data-number="${v.queue_number}" class="btn btn-danger">ส่งต่อ</button>
            </div>
          </div>
        </li>
      `;

      listHistory.append(html);
    });
  }

  function setActiveList(queueId, isHistory = 'N') {
    var listCurrent = $('#listCurrent');
    listCurrent.empty();

    var queue;

    if (isHistory === 'Y') {
      var idx = _.findIndex(QUEUES_HISTORY, { queue_id: +queueId });
      if (idx > -1) {
        queue = QUEUES_HISTORY[idx];
      }
    } else {
      var idx = _.findIndex(QUEUES, { queue_id: +queueId });
      queue = QUEUES[idx];
    }

    if (queue) {

      var html = `
      <li class="list-group-item list-group-item-action flex-column align-items-start active">
          <div class="d-flex w-100 justify-content-between">
            <h5 style="color: white;" class="font-weight-bold">${queue.queue_number}</h5>
            <h5 class="mb-1">${queue.title}${queue.first_name} ${queue.last_name}</h5>
          </div>
          <div class="d-flex w-100 justify-content-between">
            <div>
              <p class="mb-1">ประเภท: ${queue.priority_name}</p>
              <p class="mb-1">เวลา : ${queue.time_serv} น.</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-success" data-action="reCallQueue" data-number="${queue.queue_number}" data-queue-id="${queue.queue_id}">เรียกซ้ำ</button>
            </div>
          </div>
        </li>
      `;

      listCurrent.append(html);
    }

  }

  function connectWebSocket(servicePointId) {

    const GLOBAL_TOPIC = sessionStorage.getItem('QUEUE_CENTER_TOPIC');
    const NOTIFY_URL = `ws://${sessionStorage.getItem('NOTIFY_SERVER')}:${+sessionStorage.getItem('NOTIFY_PORT')}`;
    const NOTIFY_USER = sessionStorage.getItem('NOTIFY_USER');
    const NOTIFY_PASSWORD = sessionStorage.getItem('NOTIFY_PASSWORD');
    const SERVICEPOINT_TOPIC = sessionStorage.getItem('SERVICE_POINT_TOPIC');

    try {
      CLIENT.end(true);
    } catch (error) {
      console.log(error);
    }

    CLIENT = mqtt.connect(NOTIFY_URL, {
      username: NOTIFY_USER,
      password: NOTIFY_PASSWORD
    });

    const TOPIC = `${SERVICEPOINT_TOPIC}/${servicePointId}`;
    const VISIT_TOPIC = `${GLOBAL_TOPIC}/${servicePointId}`;

    CLIENT.on('connect', () => {
      console.log('Connected!');
      document.title = `CONNECTED - ${sessionStorage.getItem('FULLNAME')}`;
      IS_OFFLINE = false;

      CLIENT.subscribe(TOPIC, (error) => {
        console.log('Subscribe : ' + TOPIC);
        if (error) {
          IS_OFFLINE = true;
          console.log(error);
        }
      });

      CLIENT.subscribe(VISIT_TOPIC, (error) => {
        console.log('Subscribe : ' + VISIT_TOPIC);
        if (error) {
          IS_OFFLINE = true;
          document.title = 'SUBSCRIBE ERROR!';
          console.log(error);
        }
      });
    });

    CLIENT.on('close', () => {
      document.title = 'CONNECTION CLOSED!';
      IS_OFFLINE = true;
      console.log('Close');
    });

    CLIENT.on('message', (_topic, payload) => {
      if (_topic === VISIT_TOPIC || _topic === TOPIC) {
        console.log('Message receive: ' + payload.toString())
        getQueue();
        getHistory();
        getTransfer();
      }
    });

    CLIENT.on('error', (error) => {
      console.log('Error');
      IS_OFFLINE = true;
      document.title = 'CONNECTION ERROR!'
    });

    CLIENT.on('offline', () => {
      IS_OFFLINE = true;
      console.log('Offline');
      document.title = 'OFFLINE!';
    })
  }

  $.each(servicePoints, (k, v) => {
    $('#slServicePoints').append($("<option/>", {
      value: v.service_point_id,
      text: v.service_point_name
    }));
  });


  function setRooms(rooms) {
    $('#slRooms').empty();

    $.each(rooms, (k, v) => {
      $('#slRooms').append($("<option/>", {
        value: v.room_id,
        text: v.room_name
      }));
    });
  }

  document.title = sessionStorage.getItem('FULLNAME');

  $('body').on('click', 'button[data-name="btnTransfer"]', async function (e) {
    e.preventDefault();

    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อ Notify Server ได้',
      });
    } else {
      QUEUE_NUMBER = $(this).data('number');
      QUEUE_ID = $(this).data('queue-id');

      $('#modalServicePoints').modal({
        keyboard: false,
        backdrop: 'static'
      });
    }
  });

  $('#btnDoTransfer').on('click', function (e) {
    var transferServicePointId = $('#slTransferServicePoints').val();
    var servicePointId = $('#slServicePoints').val();

    if (transferServicePointId && servicePointId && QUEUE_NUMBER && QUEUE_ID) {
      doTransfer(QUEUE_NUMBER, QUEUE_ID, servicePointId, transferServicePointId);
    } else {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'กรุณาระบุจุดบริการ',
      });
    }
  });

  $(document).on('change', '#slServicePoints', async function (e) {
    e.preventDefault();
    var servicePointId = $('#slServicePoints').val();
    if (servicePointId) {
      try {
        $('#listCurrent').empty();
        getQueue();
        getHistory();
        getTransfer();
        connectWebSocket(servicePointId);

        var rs = await getRooms();

        ROOMS = rs.data.results;

        if (rs.data) {
          var rooms = rs.data.results;
          setRooms(rooms);
        }
      } catch (error) {
        console.log(error);
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'เกิดข้อผิดพลาดบางประการ',
        });
      }
    }
  });

  // call queue
  $('body').on('click', 'button[data-action="callQueue"]', async function () {
    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อ Notify Server ได้',
      });
    } else {
      var queueNumber = $(this).data('number');
      var queueId = $(this).data('queue-id');
      var roomId = $('#slRooms').val();

      if (roomId) {
        var idx = _.findIndex(ROOMS, { room_id: +roomId });

        var roomNumber;

        if (idx > -1) {
          roomNumber = ROOMS[idx].room_number;
        }

        await callQueue(queueNumber, +roomId, roomNumber, +queueId);
        setActiveList(queueId);

      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'กรุณาระบุห้องตรวจ',
        });
      }
    }

  });

  $('body').on('click', 'button[data-action="reCallQueue"]', async function () {
    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อ Notify Server ได้',
      });
    } else {
      var queueNumber = $(this).data('number');
      var queueId = $(this).data('queue-id');
      var roomId = $('#slRooms').val();

      if (roomId) {
        var idx = _.findIndex(ROOMS, { room_id: +roomId });

        var roomNumber;

        if (idx > -1) {
          roomNumber = ROOMS[idx].room_number;
        }

        await callQueue(queueNumber, +roomId, roomNumber, +queueId);
        setActiveList(queueId, 'Y');

      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'กรุณาระบุห้องตรวจ',
        });
      }
    }

  });

});


