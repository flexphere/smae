var tab = null,
    port = null

var mails = [],
    subjects = null,
    messages = null,
    headers = ['件名', '送信数', '再送信数', '再送信率', 'クリック数', 'クリック率', 'ダウンロード数', 'ダウンロード率', '開封数', '開封率', '拒否数', '拒否率']

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  tab = tabs[0]
  port = chrome.tabs.connect(tab.id, {name: "smc"})
  initiate()
})

function initiate(){
  vue = new Vue({
    el: '#app',
    data: { loaded:false, loading: false, messages:[], headers:[], subjects:{} },
    methods: {
      analyze: function(event){
        if (this.loading) return false
        headers, mails, messages = []
        subjects = {}
        this.loading = true
        port.postMessage('Run')
      }
    }
  })


  port.onMessage.addListener(function(res) {
    if (res.msg) {
      messages.unshift(res.msg)
      vue.messages = messages
    }

    if (res.data) {
      mails = mails.concat(res.data)
    }

    if (res.done) {
      // totals by mail subject
      for ( mail of mails ) {
        if ( ! subjects[mail.subject]) {
          subjects[mail.subject] = mail
        } else {
          for (field of Object.keys(mail)) {
            if (field != 'subject') subjects[mail.subject][field] += mail[field]
          }
        }
      }

      //calculate percentages
      $.each(subjects, function(subject, data){
        data["resend_per"]   = (data["resend"] / data["send"] * 100).toFixed(2)
        data["click_per"]    = (data["click"] / data["send"] * 100).toFixed(2)
        data["download_per"] = (data["download"] / data["send"] * 100).toFixed(2)
        data["open"]         = data["send"] - data["unread"]
        data["open_per"]     = (100 - (data["unread"] / data["send"] * 100)).toFixed(2)
        data["reject_per"]   = (data["reject"] / data["send"] * 100).toFixed(2)
      })

      vue.headers = headers
      vue.subjects = subjects
      vue.loading = false
      vue.loaded = true
    }
  })
}
