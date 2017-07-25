<div class="alert alert-info">
<ul>
	<p>输入七牛云相关信息</p>
</ul>
</div>

<form class="form">
	<div class="row">
		<div class="col-sm-6 col-xs-12">
			<div class="form-group">
				<label>Qiniu Access Key</label>
				<input id="qiniuAccessKey" type="text" class="form-control" placeholder="Enter Qiniu Access Key" value="{settings.qiniuAccessKey}">
			</div>
			<div class="form-group">
				<label>Qiniu Secret Key</label>
				<input id="qiniuSecretKey" type="text" class="form-control" placeholder="Enter Qiniu Secret Key" value="{settings.qiniuSecretKey}">
			</div>
			<div class="form-group">
				<label>Qiniu Img Bucket</label>
				<input id="qiniuImgBucket" type="text" class="form-control" placeholder="Enter Qiniu Imgage Bucket" value="{settings.qiniuImgBucket}">
			</div>
			<div class="form-group">
				<label>Qiniu CDN Domain</label>
				<input id="qiniuCDNDomain" type="text" class="form-control" placeholder="Enter Qiniu Imgage Bucket" value="{settings.qiniuCDNDomain}">
			</div>
		</div>
	</div>
</form>

<button class="btn btn-primary" id="save">Save</button>
<input id="csrf_token" type="hidden" value="{csrf}" />

<script type="text/javascript">

	$('#save').on('click', function() {
		var data = {
			_csrf: $('#csrf_token').val(),
			qiniuAccessKey: $('#qiniuAccessKey').val(),
			qiniuSecretKey: $('#qiniuSecretKey').val(),
			qiniuImgBucket: $('#qiniuImgBucket').val(),
			qiniuCDNDomain: $('#qiniuCDNDomain').val()
		};

		$.post(config.relative_path + '/api/admin/plugins/qiniu-img/save', data, function(data) {
			app.alertSuccess(data.message);
		});

		return false;
	});

</script>

