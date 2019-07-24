
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
  var DEFAULT_PRIORITY;
  var IS_COMPLETE;

  async function getServicePoints() {
    var _servicePoints = sessionStorage.getItem('servicePoints');
    return JSON.parse(_servicePoints);
  }

  async function printQueue(queueId) {
    var printerId = localStorage.getItem('printerId');
    var printSmallQueue = localStorage.getItem('printSmallQueue') || 'N';

    if (printerId) {
      try {
        var topic = `/printer/${printerId}`;
        var _apiUrl = localStorage.getItem('apiUrl');
        var token = sessionStorage.getItem('token');

        const _url = `${_apiUrl}/print/queue/prepare/print`;
        const rs = await axios.post(_url, {
          queueId: queueId,
          topic: topic,
          printSmallQueue: printSmallQueue
        }, { headers: { "Authorization": `Bearer ${token}` } });

        if (rs.data) {
          var data = rs.data;
          if (data.statusCode === 200) {
            Swal.fire({
              type: 'success',
              text: 'พิมพ์บัตรคิวเรียบร้อย',
              timer: 2000
            });
          }
        } else {
          alert(rs.message);
        }
      } catch (error) {
        console.log(error);
        this.alertService.error('ไม่สามารถพิมพ์บัตรคิวได้');
      }
    } else {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่พบเครื่องพิมพ์',
      });
    }
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

  async function cancelQueue(queueId) {
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    try {
      const _url = `${_apiUrl}/queue/cancel/${queueId}`;
      var rs = await axios.delete(_url, { headers: { "Authorization": `Bearer ${token}` } });
      if (rs.data.statusCode === 200) {
        getQueue();
      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'ไม่สามารถยกเลิกคิวได้',
        });
      }
    } catch (error) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'เกิดข้อผิดพลาด',
      });
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

  async function getPriorities() {
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    try {
      const _url = `${_apiUrl}/priorities`;
      var rs = await axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });
      if (rs.data) {
        setPriorities(rs.data.results);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function callQueue(queueNumber, roomId, roomNumber, queueId, isCompleted = 'Y') {
    var servicePointId = $('#slServicePoints').val();
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');
    IS_COMPLETE = isCompleted;
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

  async function doTransfer(queueNumber, queueId, servicePointId, transferServicePointId, priorityId) {
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
          servicePointId: transferServicePointId,
          priorityId: priorityId
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

    const _url = `${_apiUrl}/queue/working/history/${selected}?query=`;
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
      <li class="list-group-item list-group-item-action flex-column align-items-start `;
      if (v.is_interview == 'Y') {
        html += 'color-grey';
      }

      html += `">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="text-danger font-weight-bold">${v.queue_number}</h5>
            <h5 class="mb-1">${v.title}${v.first_name} ${v.last_name}</h5>
          </div>
          <div class="d-flex w-100 justify-content-between">
            <p class="mb-1 font-weight-bold">HN : ${v.hn}</p>
            <p class="mb-1">${v.priority_name}</p>
          </div>
          <div class="d-flex w-100 justify-content-between">
            <div class="btn-group">
              <button class="btn btn-primary" data-action="callQueueInterview" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">ซักประวัติ</button>
              <button class="btn btn-success" data-action="callQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">เรียกคิว</button>
              <button data-name="btnTransfer" data-priority="${v.priority_id}" data-queue-id="${v.queue_id}" data-number="${v.queue_number}" class="btn btn-warning">ส่งต่อ</button>
              <button class="btn btn-danger" data-name="btnCancelQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">ยกเลิก</button>
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
              <p class="mb-1 font-weight-bold">HN : ${v.hn}</p>
              <p class="mb-1">ประเภท: ${v.priority_name}</p>
            </div>
            <div class="btn-group">
            <button class="btn btn-success" data-action="callQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">เรียกคิว</button>
            <button class="btn btn-primary" data-action="printQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">พิมพ์</button>
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
              <p class="mb-1 font-weight-bold">HN : ${v.hn}</p>
              <p class="mb-1">ประเภท: ${v.priority_name}</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-success" data-action="reCallQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">เรียกซ้ำ</button>
              <button data-name="btnTransfer" data-priority="${v.priority_id}" data-queue-id="${v.queue_id}" data-number="${v.queue_number}" class="btn btn-warning">ส่งต่อ</button>
            </div>
          </div>
        </li>
      `;

      listHistory.append(html);
    });
  }

  function setActiveList(queueId, isHistory) {
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
              <p class="mb-1 font-weight-bold">HN : ${queue.hn}</p>
              <p class="mb-1">ประเภท: ${queue.priority_name}</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-success" data-action="reCallQueue" data-number="${queue.queue_number}" data-queue-id="${queue.queue_id}">เรียกซ้ำ</button>
              <button data-name="btnTransfer" data-priority="${queue.priority_id}" data-queue-id="${queue.queue_id}" data-number="${queue.queue_number}" class="btn btn-warning">ส่งต่อ</button>
            </div>
          </div>
        </li>
      `;

      listCurrent.append(html);
    } else {
      listCurrent.empty();
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
      text: `${v.local_code} - ${v.service_point_name}`
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

  function setPriorities(priorities) {
    $('#slTransferPriorities').empty();

    $.each(priorities, (k, v) => {
      $('#slTransferPriorities').append($("<option/>", {
        value: v.priority_id,
        text: `${v.priority_name} (prefix: ${v.priority_prefix})`
      }));
    });
  }

  document.title = sessionStorage.getItem('FULLNAME');

  getPriorities();

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
      DEFAULT_PRIORITY = $(this).data('priority');
      $('#modalServicePoints').modal({
        keyboard: false,
        backdrop: 'static'
      });
    }
  });

  $('#modalServicePoints').on('show.bs.modal', function (e) {
    $('#slTransferPriorities').val(DEFAULT_PRIORITY);
  });

  $('body').on('click', 'button[data-name="btnCancelQueue"]', async function (e) {
    e.preventDefault();

    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อ Notify Server ได้',
      });
    } else {
      var queueNumber = $(this).data('number');
      var queueId = $(this).data('queue-id');
      if (queueId) {
        cancelQueue(queueId);
      }
    }
  });

  $('#btnDoTransfer').on('click', function (e) {
    var transferServicePointId = $('#slTransferServicePoints').val();
    var servicePointId = $('#slServicePoints').val();
    var priorityId = $('#slTransferPriorities').val();

    if (transferServicePointId && servicePointId && QUEUE_NUMBER && QUEUE_ID && priorityId) {
      setActiveList(null, 'N');
      doTransfer(QUEUE_NUMBER, QUEUE_ID, servicePointId, transferServicePointId, priorityId);
    } else {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'กรุณาระบุข้อมูลให้ครบ',
      });
    }
  });

  $('#txtQuery').on('keyup', async function (e) {


    if (e.keyCode === 13) {
      var query = e.target.value;

      if (query) {
        // search
        var _apiUrl = localStorage.getItem('apiUrl');
        var token = sessionStorage.getItem('token');

        var selected = $('#slServicePoints').val();

        if (selected) {
          const _url = `${_apiUrl}/queue/waiting/${selected}`;
          var rs = await axios.post(_url, { query: query }, { headers: { "Authorization": `Bearer ${token}` } });
          var data = rs.data;

          if (data.statusCode === 200) {
            renderListWaiting(data.results);
          }
        } else {
          alert('กรุณาระบุจุดให้บริการ');
        }
      } else {
        getQueue();
      }
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
        setActiveList(queueId, 'N');

      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'กรุณาระบุห้องตรวจ',
        });
      }
    }

  });

  // call queue interview
  $('body').on('click', 'button[data-action="callQueueInterview"]', async function () {
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

        await callQueue(queueNumber, +roomId, roomNumber, +queueId, 'N');
        setActiveList(queueId, 'N');

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
        var isComplete = IS_COMPLETE === 'N' ? 'N' : 'Y';
        await callQueue(queueNumber, +roomId, roomNumber, +queueId, isComplete);
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

  $('body').on('click', 'button[data-action="printQueue"]', async function () {
    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อ Notify Server ได้',
      });
    } else {
      var queueNumber = $(this).data('number');
      var queueId = $(this).data('queue-id');

      if (queueId) {
        printQueue(queueId);
      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'ไม่พบคิว',
        });
      }
    }

  });

});


