var doLogin = async function (username, password) {
  if (username && password) {
    Swal.fire({
      title: 'กรุณารอซักครู่...',
      allowOutsideClick: false,
      onBeforeOpen: () => {
        Swal.showLoading();
      },
      onClose: () => { }
    });

    try {
      var apiUrl = localStorage.getItem('apiUrl');

      if (apiUrl) {
        var _url = `${apiUrl}/login`;
        var _body = {
          username: username,
          password: password
        };
        var rs = await axios.post(_url, _body);
        var data = rs.data;

        Swal.close();

        if (data.statusCode === 200) {
          if (data.token) {

            if ($('#isRemember').val() === 'on') {
              localStorage.setItem('loginUsername', username);
            } else {
              localStorage.removeItem('loginUsername');
            }

            var decoded = jwt_decode(data.token);

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('servicePoints', JSON.stringify(data.servicePoints));

            sessionStorage.setItem('NOTIFY_PASSWORD', decoded.NOTIFY_PASSWORD);
            sessionStorage.setItem('NOTIFY_PORT', decoded.NOTIFY_PORT);
            sessionStorage.setItem('NOTIFY_SERVER', decoded.NOTIFY_SERVER);
            sessionStorage.setItem('NOTIFY_USER', decoded.NOTIFY_USER);
            sessionStorage.setItem('SERVICE_POINT_TOPIC', decoded.SERVICE_POINT_TOPIC);
            sessionStorage.setItem('QUEUE_CENTER_TOPIC', decoded.QUEUE_CENTER_TOPIC);
            sessionStorage.setItem('FULLNAME', decoded.fullname);

            location.href = './index.html';
          } else {
            alert(data.message);
          }

        } else {
          alert('เกิดข้อผิดพลาดx')
        }
      } else {
        Swal.close();
        alert('กรุณาตั้งค่าการเชื่อมต่อ');
      }
    } catch (error) {
      Swal.close();
      console.log(error);
      alert('เกิดข้อผิดพลาด');
    }
  } else {
    alert('กรุณาระบุข้อมูลให้ครบ');
  }
}

$(document).ready(() => {

  var loginEmail = localStorage.getItem('loginUsername');

  $('#txtUsername').val(loginEmail);

  $('#btnSetting').on('click', (e) => {
    e.preventDefault();
    var apiUrl = localStorage.getItem('apiUrl');
    var printerId = localStorage.getItem('printerId');
    var printSmallQueue = localStorage.getItem('printSmallQueue') || 'N';

    $('#txtSettingUrl').val(apiUrl);
    $('#txtPrinterId').val(printerId);
    $('#radioPrinterSmallQueue').prop('checked', printSmallQueue == 'Y' ? true : false);

    $('#modalSetting').modal({
      keyboard: false,
      backdrop: 'static'
    });
  });

  $('#btnSaveSetting').on('click', (e) => {
    e.preventDefault();
    localStorage.setItem('apiUrl', $('#txtSettingUrl').val());
    localStorage.setItem('printerId', $('#txtPrinterId').val());
    localStorage.setItem('printSmallQueue', $('#radioPrinterSmallQueue:checked').val() == 'on' ? 'Y' : 'N');

    $('#modalSetting').modal('hide');
  });

  $('#btnLogin').on('click', (e) => {
    var username = $('#txtUsername').val();
    var password = $('#txtPassword').val();
    doLogin(username, password);
  });
});