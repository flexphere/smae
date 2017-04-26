(function() {
  var live, port

  chrome.runtime.onConnect.addListener(function(p) {
    live = true
    port = p

    port.onMessage.addListener(function(msg) {
      parse(location.href)
    })

    port.onDisconnect.addListener(function(){
      live = false
    })
  })



  function parse(url){
    if ( ! live) return
    var ajax = $.ajax({type: 'get', dataType: 'html', url: url})
    var page = url.match(/page=([0-9]+)/)
    page = (page) ? page[0] : "page=1"

    port.postMessage({msg: '処理中：' + page})
    ajax.done(function(html){
      mails = scrape(html)
      port.postMessage({data:mails})
      var next_url = nextpage(html)
      if (next_url) {
        parse(next_url)
      } else {
        port.postMessage({msg: '完了', done:true})
      }
    })
  }

  function nextpage(dom){
    var next = $(".paginate [rel='next']", dom)
    return next.length ? next.eq(0).attr('href') : false
  }

  function scrape(dom){
    if ( ! $(".mail_deliveries_list .item_body", dom).length) {
      port.postMessage({msg: 'メールが見つかりませんでした'})
      return false
    }

    var mails = [];
    $(".mail_deliveries_list .item_body", dom).each(function(item_index){
      var item = this
      var subject = ''
      var tmp = []
      var data = {}
      var selectors = {
        "send": ".item_elements li:eq(0) .element_content a",
        "resend": ".item_elements li:eq(0) .element_content_sub",
        "click": ".item_elements li:eq(1) .element_content",
        "download": ".item_elements li:eq(2) .element_content",
        "unread": ".item_elements li:eq(3) .element_content",
        "reject": ".item_elements li:eq(4) .element_content",
      }

      //件名を取得
      data["subject"] = $(".item_informations .item_name a", item).text();

      //各種値の取得
      $.each(selectors, function(key, selector){
        if (key == "unread") {
          data[key] = get_val($(selector, item).text().split("/")[0])
        } else if (key == "click" || key == "download") {
          data[key] = ($(selector + " a", item).length)
                    ? get_val($(selector + " a", item))
                    : get_val($(selector, item))
        } else {
          data[key] = get_val($(selector, item))
        }
      })

      mails.push(data)
    });
    return mails
  }

  function get_str(jqObj){
    var text = get_child_text(jqObj)
    return text.replace(/[\s\n\r]/g, '')
  }

  function get_val(param){
    var text = (typeof(param) == "object") ? get_child_text(param) : param
    text = text.replace(/[^0-9.]/g, "")
    return parseFloat(text)
  }

  function get_child_text($target, str) {
  	var nodes = $target
  		.contents()
  		.filter(function(){
  			return this.nodeType === 3
  			&& /\S/.test(this.data)
  			&& $.inArray($(this).parent(), $target)
  			&& (typeof str === 'undefined' || str === this.nodeValue);
      });
    return nodes.text()
  }

}).call(this)
