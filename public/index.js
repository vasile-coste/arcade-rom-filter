// start page
$('.chooseRadio').on('click', function () {
  $('.chooseRadio').removeClass('bg-blue-600 text-white');
  $('.chooseRadio').removeClass('bg-gray-50');
  $(this).addClass('bg-blue-600 text-white');

  // show next part
  const emulator = $('#' +  $(this).prop('for')).val();
  checkFiles(emulator);
});

$('.uploadFile').on('change', function () {
  const file = $(this)[0].files[0];
  uploadFile(file, $(this).prop('id'))
});

async function checkFiles (emulator) {
  $('.nextOption').hide();
  $("#continue").hide();
  $("#selectFiles").hide();

  const missingFiles = await $.ajax({
    url: '/checkFile',
    type: 'POST',
    data: {
      emulator
    }
  });

  if (missingFiles.length > 0) {
    $("#selectFiles").html(['Files are not uploaded.'].concat(missingFiles).join("<br />"));
    $("#selectFiles").show();
  } else {
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

  const emulator = $('input[name="emu"]:checked').val();
  const missingFiles = checkFiles(emulator);

  if (missingFiles.length != 0) {
    // cannot proceed to next step
    return false;
  }

  localStorage.setItem('emulator', emulator);

  // next page
  location.href = `/filter-${emulator}-roms.html`;
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
