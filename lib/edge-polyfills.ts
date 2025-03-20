/**
 * Applies polyfills and optimizations for Microsoft Edge browser
 */
export function applyEdgePolyfills() {
  // Only run in browser environment
  if (typeof window === "undefined") {
    return
  }

  try {
    // Check if running in Edge
    const isEdge = navigator.userAgent.indexOf("Edge") > -1 || navigator.userAgent.indexOf("Edg/") > -1

    if (isEdge) {
      console.log("Microsoft Edge detected, applying optimizations")

      // Apply Edge-specific optimizations
      // Example: Improve smooth scrolling in Edge
      if ("scrollBehavior" in document.documentElement.style) {
        const scrollElements = document.querySelectorAll(".scroll-smooth")
        scrollElements.forEach((el) => {
          el.addEventListener("wheel", (e) => {
            if (e.deltaY !== 0) {
              e.preventDefault()
              el.scrollTop += e.deltaY
            }
          })
        })
      }
    }
  } catch (error) {
    console.error("Error applying Edge polyfills:", error)
  }
}

