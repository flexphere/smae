(function() {
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
    parse(location.href);
  });

  function parse(url){
    var page = url.match(/page=([0-9]+)/)
    page = (page) ? page[0] : "page=1"

    chrome.runtime.sendMessage({msg: '処理中：' + page}, function(response){
      var ajax = $.ajax({type: 'get', dataType: 'html', url: url})
      ajax.done(function(html){
        mails = scrape(html)
        chrome.runtime.sendMessage({data:mails}, function(response){
          debugger;
          var next_url = nextpage(html)
          if (next_url) {
            parse(next_url)
          } else {
            chrome.runtime.sendMessage({msg: '完了', done:true})
          }
        })
      })
    })
  }

  function nextpage(dom){
    var next = $(".paginate [rel='next']", dom)
    return next.length ? next.eq(0).attr('href') : false
  }

  function scrape(dom){
    if ( ! $(".mail_deliveries_list .item_body", dom).length) {
      chrome.runtime.sendMessage({msg: 'メールが見つかりませんでした'});
      return false;
    }

    var mails = [];
    $(".mail_deliveries_list .item_body", dom).each(function(item_index){
      var item = this;
      var subject = '';
      var tmp = [];
      var data = {};
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
          data[key] = get_val($(selector, item).text().split("/")[0]);
        } else {
          data[key] = get_val($(selector, item));
        }
      })

      mails.push(data)
    });
    return mails
  }

  function get_str(jqObj){
    var text = get_child_text(jqObj);
    return text.replace(/[\s\n\r]/g, '');
  }

  function get_val(param){
    var text = (typeof(param) == "object") ? get_child_text(param) : param;
    text = text.replace(/[^0-9.]/g, "");
    return parseFloat(text);
  }

  function get_child_text($target, str) {
  	var nodes = $target
  		.contents()
  		.filter(function(){
  			return this.nodeType === 3 // テキストノードか否か
  			&& /\S/.test(this.data) // 空白か否か
  			&& $.inArray($(this).parent(), $target) // 直下か否か
  			&& (typeof str === 'undefined' || str === this.nodeValue); // 文字列の指定がある場合
      });
    return nodes.text();
  }

}).call(this);
