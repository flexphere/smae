var vue;

(function() {

  vue = new Vue({
    el: '#app',
    data: {
      status: true,
      message: '',
      result: {
        // header:['col1','col2','col3','col4','col5','col6','col7','col8','col9','col10'],
        // body:{
        //   'test':{
        //     stats:['1','2','3','0','5','0','7','100','9','10'],
        //     data:[1, 2, 3, 4, 5]
        //   }
        // }
      }
    },
    methods: {
      analyze: function(event){
        event.preventDefault();
        var self = this;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, 'onCheck',
          function(res) {
            this.status = res.success;
            if (res.success) {
              self.result = res.data;
            } else {
              self.message = res.message;
            }
          });
        });
      }
    }
  });

}).call(this);

function handleDownload(){
  var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  var content = generate_csv(vue.result);
  var blob = new Blob([ bom, content ], { "type" : "text/csv" });

  document.getElementById("download").href = window.URL.createObjectURL(blob);
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, "result.csv");
    // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
    window.navigator.msSaveOrOpenBlob(blob, "result.csv");
  } else {
    document.getElementById("download").href = window.URL.createObjectURL(blob);
  }
}

function generate_csv(data){
  var csv_rows = [];

  //ヘッダー
  var header = $.merge([], data.header);
  header.unshift('件名');
  csv_rows.push(header);

  //データ
  $.map(data.body, function(value, key){
    var stats = $.merge([], value.stats);
    stats.unshift(key);
    csv_rows.push(stats);
  });
  return csv_rows.join("\n");
}
