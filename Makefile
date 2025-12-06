.PHONY: local

# Required environment variables
REQUIRED_VARS := VITE_THIRDWEB_CLIENT_ID

local:
	@echo "🔍 Checking .env.local for required environment variables..."
	@if [ ! -f .env.local ]; then \
		echo "❌ Error: .env.local file not found!"; \
		echo ""; \
		echo "Please create .env.local with the following variables:"; \
		echo "  VITE_THIRDWEB_CLIENT_ID=your_client_id_here"; \
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
