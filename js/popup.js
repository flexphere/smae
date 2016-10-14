var vue;

(function() {

  vue = new Vue({
    el: '#app',
    data: {
      message: null,
      result: null
    },
    methods: {
      analyze: function(event){
        event.preventDefault();
        var self = this;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, 'onCheck',
          function(res) {
            if (res.success) {
              self.result = res.data;
              self.message = null;
            } else {
              self.result = null;
              self.message = res.message;
            }
          });
        });
      },
      download: function(event){
        var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        var content = this._generate_csv(this.result);
        var blob = new Blob([ bom, content ], { "type" : "text/csv" });
        saveAs(blob, 'result.csv');
      },
      _generate_csv: function(data){
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
    }
  });

}).call(this);
