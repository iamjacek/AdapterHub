<?php
/**
 * Plugin Name: AdapterHub Core
 * Description: AdapterHub custom functionality for WooCommerce Product Brands and homepage car brand display.
 * Version: 1.6.0
 * Author: AdapterHub
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Add Display Order to WooCommerce Product Brands.
 */
add_action( 'product_brand_add_form_fields', function() {
    ?>
    <div class="form-field">
        <label for="adapterhub_display_order">Display Order</label>
        <input type="number" name="adapterhub_display_order" id="adapterhub_display_order" value="0" min="0" step="1">
        <p>Lower numbers appear first on the AdapterHub homepage.</p>
    </div>
    <?php
} );

add_action( 'product_brand_edit_form_fields', function( $term ) {
    $order = get_term_meta( $term->term_id, 'adapterhub_display_order', true );
    ?>
    <tr class="form-field">
        <th scope="row"><label for="adapterhub_display_order">Display Order</label></th>
        <td>
            <input type="number" name="adapterhub_display_order" id="adapterhub_display_order" value="<?php echo esc_attr( $order !== '' ? $order : 0 ); ?>" min="0" step="1">
            <p class="description">Lower numbers appear first on the AdapterHub homepage.</p>
        </td>
    </tr>
    <?php
} );

function adapterhub_save_brand_display_order( $term_id ) {
    if ( isset( $_POST['adapterhub_display_order'] ) ) {
        update_term_meta(
            $term_id,
            'adapterhub_display_order',
            max( 0, intval( $_POST['adapterhub_display_order'] ) )
        );
    }
}
add_action( 'created_product_brand', 'adapterhub_save_brand_display_order' );
add_action( 'edited_product_brand', 'adapterhub_save_brand_display_order' );

/**
 * Car Brands shortcode.
 * Uses WooCommerce Product Brands as the single source of truth.
 *
 * Homepage:
 * [adapterhub_car_brands]
 *
 * All brands:
 * [adapterhub_car_brands all="true"]
 */
add_shortcode( 'adapterhub_car_brands', function( $atts ) {

    if ( ! taxonomy_exists( 'product_brand' ) ) {
        return '';
    }

    $atts = shortcode_atts(
        array(
            'all' => 'false',
        ),
        $atts,
        'adapterhub_car_brands'
    );

    $show_all = filter_var( $atts['all'], FILTER_VALIDATE_BOOLEAN );

    $args = array(
        'taxonomy'   => 'product_brand',
        'hide_empty' => false,
        'meta_key'   => 'adapterhub_display_order',
        'orderby'    => 'meta_value_num',
        'order'      => 'ASC',
    );

    /*
     * Homepage = limited list.
     * Car Brands page = all brands.
     */
    if ( ! $show_all ) {
        $args['number'] = 8;
    }

    $brands = get_terms( $args );

    if ( is_wp_error( $brands ) || empty( $brands ) ) {
        return '';
    }

    $wrapper_class = $show_all
        ? 'adapterhub-car-brands adapterhub-car-brands-all'
        : 'adapterhub-car-brands adapterhub-car-brands-home';

    ob_start();
    ?>

    <div class="<?php echo esc_attr( $wrapper_class ); ?>">

        <?php foreach ( $brands as $brand ) :

            $thumbnail_id = get_term_meta(
                $brand->term_id,
                'thumbnail_id',
                true
            );

            $logo_url = $thumbnail_id
                ? wp_get_attachment_image_url( $thumbnail_id, 'full' )
                : '';

            $name = $brand->name;
            $link = get_term_link( $brand );

            if ( is_wp_error( $link ) ) {
                continue;
            }
            ?>

            <a
                class="adapterhub-car-brand-item adapterhub-car-brand"
                href="<?php echo esc_url( $link ); ?>"
            >
                <span class="adapterhub-car-brand-logo">

                    <?php if ( $logo_url ) : ?>

                        <img
                            src="<?php echo esc_url( $logo_url ); ?>"
                            alt="<?php echo esc_attr( $name ); ?>"
                        >

                    <?php endif; ?>

                </span>

                <span class="adapterhub-car-brand-name">
                    <?php echo esc_html( $name ); ?>
                </span>

            </a>

        <?php endforeach; ?>


        <?php if ( ! $show_all ) : ?>

            <a
                class="adapterhub-car-brand-item adapterhub-more-brands"
                href="<?php echo esc_url( home_url( '/car-brands/' ) ); ?>"
            >
                <span class="adapterhub-more-brands-icon" aria-hidden="true">
                    +
                </span>

                <span class="adapterhub-car-brand-name">
                    More Brands
                </span>
            </a>

        <?php endif; ?>

    </div>

    <?php

    return ob_get_clean();
} );

/**
 * Homepage Featured Products shortcode.
 * Uses WooCommerce products manually marked as Featured.
 */
add_shortcode( 'adapterhub_featured_products', function( $atts ) {
    if ( ! class_exists( 'WooCommerce' ) ) {
        return '';
    }

    $atts = shortcode_atts( array(
        'limit' => 5,
    ), $atts, 'adapterhub_featured_products' );

    $products = wc_get_products( array(
        'status'    => 'publish',
        'featured'  => true,
        'limit'     => max( 1, intval( $atts['limit'] ) ),
        'orderby'   => 'menu_order',
        'order'     => 'ASC',
        'return'    => 'objects',
    ) );

    if ( empty( $products ) ) {
        return '<div class="adapterhub-featured-products-empty">No featured products available.</div>';
    }

    ob_start();
    ?>
    <div class="adapterhub-featured-products">
        <?php foreach ( $products as $product ) :
            $product_id = $product->get_id();
            $image_id   = $product->get_image_id();
            $image_url  = $image_id ? wp_get_attachment_image_url( $image_id, 'woocommerce_thumbnail' ) : '';
            $link       = get_permalink( $product_id );
            ?>
            <a class="adapterhub-product-card" href="<?php echo esc_url( $link ); ?>">
                <span class="adapterhub-product-image">
                    <?php if ( $image_url ) : ?>
                        <img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( $product->get_name() ); ?>">
                    <?php endif; ?>
                </span>
                <span class="adapterhub-product-name"><?php echo esc_html( $product->get_name() ); ?></span>
                <span class="adapterhub-product-price"><?php echo wp_kses_post( $product->get_price_html() ); ?></span>
            </a>
        <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
} );

/* =========================================================
   SHOP — DYNAMIC SUBTITLE
   ========================================================= */

function adapterhub_shop_subtitle() {

    if ( ! is_shop() ) {
        return;
    }

    $subtitle = 'High-quality speaker adapters for popular car brands. Easy installation, perfect fit and better sound in your car.';

    if ( isset( $_GET['product_brand'] ) ) {

        $brand_slug = sanitize_text_field(
            wp_unslash( $_GET['product_brand'] )
        );

        $brand = get_term_by(
            'slug',
            $brand_slug,
            'product_brand'
        );

        if ( $brand && ! is_wp_error( $brand ) ) {
            $subtitle = 'Adapters designed for ' . $brand->name . ' vehicles.';
        }
    }

    echo '<p class="adapterhub-shop-subtitle">' . esc_html( $subtitle ) . '</p>';
}

add_action( 'woocommerce_before_shop_loop', 'adapterhub_shop_subtitle', 4 );

/* =========================================================
   SHOP — BRAND FILTER
   ========================================================= */

function adapterhub_shop_brand_filter() {

    if ( ! is_shop() ) {
        return;
    }

    $brands = get_terms(
        array(
            'taxonomy'   => 'product_brand',
            'hide_empty' => true,
            'orderby'    => 'name',
            'order'      => 'ASC',
        )
    );

    if ( is_wp_error( $brands ) || empty( $brands ) ) {
        return;
    }

    $current_brand = isset( $_GET['product_brand'] )
        ? sanitize_text_field( wp_unslash( $_GET['product_brand'] ) )
        : '';

    echo '<div class="adapterhub-shop-filters">';

    echo '<a class="adapterhub-shop-filter' . ( empty( $current_brand ) ? ' is-active' : '' ) . '" href="' . esc_url( wc_get_page_permalink( 'shop' ) ) . '">All</a>';

    foreach ( $brands as $brand ) {

        $brand_url = add_query_arg(
            'product_brand',
            $brand->slug,
            wc_get_page_permalink( 'shop' )
        );

        $active_class = ( $current_brand === $brand->slug )
            ? ' is-active'
            : '';

        echo '<a class="adapterhub-shop-filter' . esc_attr( $active_class ) . '" href="' . esc_url( $brand_url ) . '">';
        echo esc_html( $brand->name );
        echo '</a>';
    }

    echo '</div>';
}

add_action( 'woocommerce_before_shop_loop', 'adapterhub_shop_brand_filter', 5 );

/* =========================================================
   WOOCOMMERCE — ADD TO BASKET
   ========================================================= */

add_filter( 'woocommerce_product_add_to_cart_text', function() {
    return 'Add to Basket';
} );

add_filter( 'woocommerce_product_single_add_to_cart_text', function() {
    return 'Add to Basket';
} );

