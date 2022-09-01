//
async function checkFiles (emulator) {
  $('.nextOption').hide();
  const missingFiles = await $.ajax({
    url: '/checkFile',
    type: 'POST',
    data: {
      emulator
    }
  });

  if (missingFiles.length > 0) {
    $("#selectFiles").html(missingFiles.join("<br />"));
    $("#selectFiles").show();
    $("#continue").hide();
  } else {
    $("#selectFiles").hide();
    $("#continue").show();
  }

  $('.' + emulator).show();

  return missingFiles;
}

async function uploadFile (file, progress_bar_id) {
  const emulator = $('input[name="emu"]:checked').val();
  const upload = new Upload(file, emulator, progress_bar_id);

  // execute upload
  upload.doUpload();
}

function pageLoaded (arg = 'ok') {
  console.log(`Page loaded ${arg}`);
}

async function setEmulator () {
  if (!$('input[name="emu"]:checked').val()) {
    return alert("Please select an emulator!");
  }

  if ($('#useDefault').is(':checked') == false) {
    const missingFiles = checkFiles($('input[name="emu"]:checked').val());
    if(missingFiles.length != 0) {
      // cannot proceed to next step
      return false;
    }
    localStorage.setItem('default_files', 'no');
  } else {
    localStorage.setItem('default_files', 'yes');
  }

  localStorage.setItem('emulator', $('input[name="emu"]:checked').val());
  // const global = JSON.parse(localStorage.getItem('global'));
  
  location.href = '/filter-roms.html';
}

function setFilter() {
  
}

async function exitApp () {
  await $.ajax({
    url: '/exit',
    type: 'GET'
  });
}


const Upload = function (file, emulator, progress_bar_id) {
  this.file = file;
  this.emulator = emulator;
  this.progress_bar_id = `#${progress_bar_id}-progress`;
};

Upload.prototype.getType = function () {
  return this.file.type;
};
Upload.prototype.getSize = function () {
  return this.file.size;
};
Upload.prototype.getName = function () {
  return this.file.name;
};
Upload.prototype.doUpload = function () {
  const that = this;
  const formData = new FormData();

  // add assoc key values, this will be posts values
  formData.append("file", this.file, this.getName());
  formData.append("emulator", this.emulator);

  $.ajax({
    type: "POST",
    url: "/upload-file",
    xhr: function () {
      const myXhr = $.ajaxSettings.xhr();
      if (myXhr.upload) {
        myXhr.upload.addEventListener('progress', (event) => {
          let percent = 0;
          const position = event.loaded || event.position;
          const total = event.total;
          if (event.lengthComputable) {
            percent = Math.ceil(position / total * 100);
          }
          // update progressbars classes so it fits your code
          $(that.progress_bar_id + " .progress-bar").css("width", +percent + "%");
          $(that.progress_bar_id + " .status").text(percent + "%");
        }, false);
      }
      return myXhr;
    },
    success: function (data) {
      // your callback here
      checkFiles(that.emulator)
    },
    error: function (error) {
      // handle error
    },
    async: true,
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    timeout: 60000
  });
};
