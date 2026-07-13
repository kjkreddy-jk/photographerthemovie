<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$template_file = get_template_directory() . '/index.html';

if ( ! file_exists( $template_file ) ) {
	status_header( 500 );
	wp_die( esc_html__( 'Theme template file is missing.', 'photographer-official-theme' ) );
}

$html = file_get_contents( $template_file );

if ( false === $html ) {
	status_header( 500 );
	wp_die( esc_html__( 'Theme template file could not be read.', 'photographer-official-theme' ) );
}

ob_start();
wp_head();
$wp_head_markup = ob_get_clean();

ob_start();
if ( function_exists( 'wp_body_open' ) ) {
	wp_body_open();
}
$wp_body_open_markup = ob_get_clean();

ob_start();
wp_footer();
$wp_footer_markup = ob_get_clean();

$theme_support_js = sprintf(
	'<script src="%s"></script>',
	esc_url( get_template_directory_uri() . '/support.js' )
);

$body_open_tag = sprintf(
	'<body class="%s">%s',
	esc_attr( implode( ' ', get_body_class() ) ),
	$wp_body_open_markup
);

$html = str_replace( '<script src="./support.js"></script>', $theme_support_js, $html );
$html = str_replace( '</head>', $wp_head_markup . PHP_EOL . '</head>', $html );
$html = preg_replace( '/<body[^>]*>/', $body_open_tag, $html, 1 );
$html = str_replace( '</body>', $wp_footer_markup . PHP_EOL . '</body>', $html );

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
