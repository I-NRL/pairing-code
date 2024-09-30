function makeid(num = 4) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var characters9 = characters.length;
  for (var i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters9));
  }
  return result;
}
function encrypt(session){
let b = session.split("")
let c = "",l="",d=""
b.map((m)=>{
    if(c.length<5){
        c += m;
        l += m;
    } else {
        c = l + makeid()
        //d = l;
    }
    d =c+session.replace(l,'')
})
  return d;
}

function decrypt(session){
    session = session.replace(/inrl~/,'');
    let b = session.split("")
    let c = "",l="",d="",t;
    b.map((m)=>{
        if(c.length<5){
            c += m;
        } else {
            l = session.replace(c,'');
        }
        let q = l.split("");
        q.map((r)=>{
            if(d.length < 4 ){
                d += r; 
            }
        })
    })
    t = c + session.replace(c,'').replace(d,'');
    return t;
    }
module.exports = { makeid, encrypt, decrypt };