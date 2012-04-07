(function($) {

	var form_sel = '.search-form';
	var query_sel = form_sel + ' .query';
	var search_url = '/api/users/search';

	$(document).ready(function() {
		init($(form_sel));
	});

	function init(jform) {
		jform.submit(function() {
			var query = $(query_sel).val();

			//handle it if its not empty
			if (query) {
				$.ajax({
					type: 'POST',
					data: { query: query },
					url: search_url,
					success: function(data) {
						if (data.response.success) {
							//show the list of users
							handleSuccess(query, data.response.success);
						}
						else {
							//show the error
							handleError(query, data.response.error.userMsg);
						}
					},
					error: function(data) {
						//show an error
						handleError(query, 'Uh oh! Something went wrong while processing your request');
					}
				});
			}

			return false; //never actually send the form
		});
	}

	//successful response from the server
	function handleSuccess(query, users)  {
		//handle the special case of no search results
		if (user.length == 0) return handleEmpty(query);

		//TODO
	}

	//no search results from the server
	function handleEmpty(query) {
		//TODO
	}

	//some sort of error
	function handleError(query, errorMsg) {
		//TODO
	}

})(jQuery);
