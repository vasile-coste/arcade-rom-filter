// global
async function exitApp () {
  await $.ajax({
    url: '/exit',
    type: 'GET'
  });
}
