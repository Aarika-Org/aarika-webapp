.PHONY: local pull-postman

# Pull Postman collection using env variables from .devworkflow.env
pull-postman:
	@echo "📥 Pulling Postman collection..."
	@if [ ! -f .devworkflow.env ]; then \
		echo "❌ Error: .devworkflow.env file not found!"; \
		echo ""; \
		echo "Please create .devworkflow.env with the following variables:"; \
		echo "  POSTMAN_API_KEY=your_api_key_here"; \
		echo "  POSTMAN_COLLECTION_UID=your_collection_uid_here"; \
		exit 1; \
	fi
	@. ./.devworkflow.env && \
	if [ -z "$$POSTMAN_API_KEY" ]; then \
		echo "❌ Error: POSTMAN_API_KEY is not set in .devworkflow.env"; \
		exit 1; \
	fi && \
	if [ -z "$$POSTMAN_COLLECTION_UID" ]; then \
		echo "❌ Error: POSTMAN_COLLECTION_UID is not set in .devworkflow.env"; \
		exit 1; \
	fi && \
	echo "🔗 Fetching collection: $$POSTMAN_COLLECTION_UID" && \
	curl -s -X GET "https://api.getpostman.com/collections/$$POSTMAN_COLLECTION_UID" \
		-H "X-Api-Key: $$POSTMAN_API_KEY" \
		-o postman_collection.json && \
	if [ -s postman_collection.json ]; then \
		echo "✅ Collection saved to postman_collection.json"; \
	else \
		echo "❌ Failed to fetch collection. Check your API key and collection UID."; \
		rm -f postman_collection.json; \
		exit 1; \
	fi

# Required environment variables
REQUIRED_VARS := VITE_THIRDWEB_CLIENT_ID VITE_AARIKA_CORE_ENDPOINT

local:
	@echo "🔍 Checking .env.local for required environment variables..."
	@if [ ! -f .env.local ]; then \
		echo "❌ Error: .env.local file not found!"; \
		echo ""; \
		echo "Please create .env.local with the following variables:"; \
		echo "  VITE_THIRDWEB_CLIENT_ID=your_client_id_here"; \
		echo "  VITE_AARIKA_CORE_ENDPOINT=your_backend_url_here"; \
		echo ""; \
		echo "Get your Client ID from: https://thirdweb.com/dashboard"; \
		exit 1; \
	fi
	@missing=""; \
	for var in $(REQUIRED_VARS); do \
		if ! grep -q "^$$var=" .env.local 2>/dev/null; then \
			missing="$$missing $$var"; \
		fi; \
	done; \
	if [ -n "$$missing" ]; then \
		echo "❌ Missing required environment variables:$$missing"; \
		echo ""; \
		echo "Please add the following to your .env.local:"; \
		for var in $$missing; do \
			echo "  $$var=your_value_here"; \
		done; \
		exit 1; \
	fi
	@echo "✅ All required environment variables are set!"
	@echo ""
	@echo "Starting development server..."
	@npm run dev
