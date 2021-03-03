module.exports.name = 'translation';
module.exports.alias = ['translation', 'tl'];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return true;
};

module.exports.help = '`,tl` explains why translation request is not allowed';

module.exports.command = async (message) => {
  message.channel.send(
    'This is not a translation server, we do not allow translation requests. If you have an attempt of your own that you wish to have corrected you may go ahead, but please do not attempt to solicit free translations.' +
      'ここは翻訳のサーバーではありません。私たちは翻訳のリクエストを受け付けていません。まずは自分で翻訳し、添削を依頼することは可能ですが、翻訳依頼はやめてください。' +
      'Try https://reddit.com/r/translator or https://www.deepl.com/. For images, Google Translate has an option to translate from images'
  );
  message.delete();
};
