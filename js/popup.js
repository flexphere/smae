var mails = []
var subjects = {}
var vue = null

vue = new Vue({
  el: '#app',
  data: {
    messages: [],
    subjects: subjects,
  },
  methods: {
    analyze: function(event){
      event.preventDefault();
      var self = this
      subjects = {}
      mails = []
      self.messages = []

      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 'onCheck', function(){});
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


chrome.runtime.onMessage.addListener(function(res, sender, sendResponse){
  if (res.msg) {
    vue.messages.unshift(res.msg)
  }

  if (res.data) {
    mails = mails.concat(res.data)
    console.log(mails)
  }

  if (res.status == 'done') {
    //全てのページの読み込みが完了
    for ( mail of mails ) {
      //件名がなければ追加
      if ( ! subjects[mail.subject]) {
        subjects[mail.subject] = mail
      } else {
        for (field of Object.keys(mail)) {
          if (field == 'subject') continue
          subjects[mail.subject][field] += mail[field]
        }
      }
    }
    vue.subjects = subjects
    console.log(subjects)
  }

  sendResponse("OK")
});
